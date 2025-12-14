export class AudioEngine {
  private audioContext: AudioContext | null = null
  private audioBuffer: AudioBuffer | null = null
  private currentSource: AudioBufferSourceNode | null = null
  private gainNode: GainNode | null = null
  private audioUrl: string
  private _volume: number = 1.0
  private _muted: boolean = false
  private _octaveShift: number = 0
  private _pitchMode: "value" | "position" = "value"

  constructor(audioUrl: string) {
    this.audioUrl = audioUrl
  }

  async initialize(): Promise<void> {
    if (this.audioContext) return

    this.audioContext = new AudioContext()
    this.gainNode = this.audioContext.createGain()
    this.gainNode.connect(this.audioContext.destination)
    this.updateVolume()

    const response = await fetch(this.audioUrl)
    const arrayBuffer = await response.arrayBuffer()
    this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer)
  }

  async resume(): Promise<void> {
    if (this.audioContext?.state === "suspended") {
      await this.audioContext.resume()
    }
  }

  playChoppedSound(
    value: number,
    maxValue: number,
    speedMultiplier: number = 1.0,
    position?: number,
  ): void {
    const rate = this.calculateRate(value, maxValue, 0.5, 2.5, position)
    this.playGrain(rate, speedMultiplier)
  }

  playChoppedSoundSubtle(
    value: number,
    maxValue: number,
    speedMultiplier: number = 1.0,
    position?: number,
  ): void {
    const rate = this.calculateRate(value, maxValue, 0.9, 1.1, position)
    this.playGrain(rate, speedMultiplier)
  }

  playChoppedSoundUnpitched(speedMultiplier: number = 1.0): void {
    // 옥타브 시프트만 적용하고 기본 rate는 1.0
    const octaveMultiplier = Math.pow(2, this._octaveShift - 0.5)
    this.playGrain(octaveMultiplier, speedMultiplier)
  }

  playFullAudio(onComplete?: () => void): number {
    if (!this.checkContext()) return 0

    this.stopCurrentSound()

    const source = this.audioContext!.createBufferSource()
    source.buffer = this.audioBuffer
    source.playbackRate.value = 1.0
    source.connect(this.gainNode!)

    source.start(0)
    this.currentSource = source

    source.onended = () => {
      if (this.currentSource === source) {
        this.currentSource = null
      }
      onComplete?.()
    }

    return this.audioBuffer!.duration
  }

  private calculateRate(
    value: number,
    maxValue: number,
    minRate: number,
    maxRate: number,
    position?: number,
  ): number {
    const pitchValue = this._pitchMode === "position" && position !== undefined
      ? position
      : value

    // 선형 보간
    const rate = minRate + (pitchValue / maxValue) * (maxRate - minRate)

    // 옥타브 적용
    const octaveMultiplier = Math.pow(2, this._octaveShift - 0.5)

    return rate * octaveMultiplier
  }

  private playGrain(rate: number, speedMultiplier: number): void {
    if (!this.checkContext()) return

    this.stopCurrentSound()

    const ctx = this.audioContext!
    const source = ctx.createBufferSource()
    source.buffer = this.audioBuffer

    // 최종 재생 속도 설정
    source.playbackRate.value = rate * speedMultiplier

    // 클릭 노이즈 방지용 GainNode (Envelope)
    const grainGain = ctx.createGain()
    source.connect(grainGain)
    grainGain.connect(this.gainNode!)

    // 재생 구간 설정
    const grainDuration = 0.1
    const bufferDuration = this.audioBuffer!.duration

    // 랜덤 시작 위치 (전체의 10% ~ 90% 사이)
    const startOffset = (bufferDuration * 0.1) +
      Math.random() * (bufferDuration * 0.8 - grainDuration)

    const now = ctx.currentTime

    // 볼륨 엔벨로프 (Fade In/Out)
    grainGain.gain.setValueAtTime(0, now)
    grainGain.gain.linearRampToValueAtTime(1, now + 0.01)
    grainGain.gain.setValueAtTime(1, now + grainDuration - 0.01)
    grainGain.gain.linearRampToValueAtTime(0, now + grainDuration)

    // 재생 및 예약
    source.start(now, startOffset, grainDuration)
    source.stop(now + grainDuration + 0.05)

    this.currentSource = source

    // Auto-cleanup
    source.onended = () => {
      source.disconnect()
      grainGain.disconnect()
      if (this.currentSource === source) {
        this.currentSource = null
      }
    }
  }

  private checkContext(): boolean {
    return !!(this.audioContext && this.audioBuffer && this.gainNode)
  }

  stopCurrentSound(): void {
    if (this.currentSource) {
      try {
        this.currentSource.stop()
      } catch (_e) {
        // Ignore if already stopped
      }
      this.currentSource = null
    }
  }

  set volume(value: number) {
    this._volume = Math.max(0, Math.min(1, value))
    this.updateVolume()
  }

  get volume(): number {
    return this._volume
  }

  set muted(value: boolean) {
    this._muted = value
    this.updateVolume()
  }

  get muted(): boolean {
    return this._muted
  }

  set octaveShift(value: number) {
    this._octaveShift = value
  }

  get octaveShift(): number {
    return this._octaveShift
  }

  set pitchMode(value: "value" | "position") {
    this._pitchMode = value
  }

  get pitchMode(): "value" | "position" {
    return this._pitchMode
  }

  private updateVolume(): void {
    if (this.gainNode) {
      this.gainNode.gain.value = this._muted ? 0 : this._volume
    }
  }

  getAudioDuration(): number {
    return this.audioBuffer?.duration ?? 0
  }

  isAudioBlocked(): boolean {
    return this.audioContext?.state === "suspended"
  }

  dispose(): void {
    this.stopCurrentSound()
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
    this.audioBuffer = null
    this.gainNode = null
  }
}
