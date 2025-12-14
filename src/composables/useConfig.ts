import { ref, watch } from "vue"

export interface Config {
  sliceCount: number
  volume: number
  muted: boolean
  speedMultiplier: number
  algorithmId: string
  completionAudioMode: "full" | "chopped"
  octaveShift: number
  pitchMode: "value" | "position"
  replay: boolean
}

const DEFAULT_CONFIG: Config = {
  sliceCount: 128,
  volume: 1.0,
  muted: false,
  speedMultiplier: 1.0,
  algorithmId: "merge",
  completionAudioMode: "full",
  octaveShift: 0,
  pitchMode: "value",
  replay: false,
}

const loadFromLocalStorage = (): Partial<Config> => {
  try {
    const stored = localStorage.getItem("sortingConfig")
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

const loadFromURLParams = (): Partial<Config> => {
  const params = new URLSearchParams(globalThis.location.search)
  const config: Partial<Config> = {}

  const sliceCount = params.get("sliceCount")
  if (sliceCount) config.sliceCount = parseInt(sliceCount, 10)

  const volume = params.get("volume")
  if (volume) config.volume = parseFloat(volume)

  const muted = params.get("muted")
  if (muted) config.muted = muted === "true"

  const speedMultiplier = params.get("speed")
  if (speedMultiplier) config.speedMultiplier = parseFloat(speedMultiplier)

  const algorithmId = params.get("algorithm")
  if (algorithmId) config.algorithmId = algorithmId

  const completionAudioMode = params.get("completionAudioMode")
  if (completionAudioMode === "full" || completionAudioMode === "chopped") {
    config.completionAudioMode = completionAudioMode
  }

  const octaveShift = params.get("octaveShift")
  if (octaveShift) config.octaveShift = parseFloat(octaveShift)

  const pitchMode = params.get("pitchMode")
  if (pitchMode === "value" || pitchMode === "position") {
    config.pitchMode = pitchMode
  }

  const replay = params.get("replay")
  if (replay) config.replay = replay === "true"

  return config
}

const saveToLocalStorage = (config: Config): void => {
  try {
    localStorage.setItem("sortingConfig", JSON.stringify(config))
  } catch {
    // Ignore storage errors
  }
}

const updateURLParams = (config: Config): void => {
  const params = new URLSearchParams()
  params.set("sliceCount", config.sliceCount.toString())
  params.set("volume", config.volume.toString())
  params.set("muted", config.muted.toString())
  params.set("speed", config.speedMultiplier.toString())
  params.set("algorithm", config.algorithmId)
  params.set("completionAudioMode", config.completionAudioMode)
  params.set("octaveShift", config.octaveShift.toString())
  params.set("pitchMode", config.pitchMode)
  params.set("replay", config.replay.toString())

  const newUrl = `${globalThis.location.pathname}?${params.toString()}`
  globalThis.history.replaceState({}, "", newUrl)
}

export function useConfig() {
  // Load config from URL params (priority) then localStorage
  const urlConfig = loadFromURLParams()
  const storageConfig = loadFromLocalStorage()
  const initialConfig = { ...DEFAULT_CONFIG, ...storageConfig, ...urlConfig }

  const sliceCount = ref(initialConfig.sliceCount)
  const volume = ref(initialConfig.volume)
  const muted = ref(initialConfig.muted)
  const speedMultiplier = ref(initialConfig.speedMultiplier)
  const algorithmId = ref(initialConfig.algorithmId)
  const completionAudioMode = ref(initialConfig.completionAudioMode)
  const octaveShift = ref(initialConfig.octaveShift)
  const pitchMode = ref(initialConfig.pitchMode)
  const replay = ref(initialConfig.replay)

  // Debounce both localStorage and URL updates to prevent desync
  let saveTimeout: number | null = null

  const debouncedSaveConfig = () => {
    // Debounce ALL saves (both localStorage and URL) to prevent race conditions
    if (saveTimeout !== null) {
      clearTimeout(saveTimeout)
    }
    saveTimeout = setTimeout(() => {
      // Capture CURRENT values at time of save
      const currentConfig: Config = {
        sliceCount: sliceCount.value,
        volume: volume.value,
        muted: muted.value,
        speedMultiplier: speedMultiplier.value,
        algorithmId: algorithmId.value,
        completionAudioMode: completionAudioMode.value,
        octaveShift: octaveShift.value,
        pitchMode: pitchMode.value,
        replay: replay.value,
      }
      console.log(
        "[useConfig] Saving config with algorithmId:",
        currentConfig.algorithmId,
      )
      saveToLocalStorage(currentConfig)
      updateURLParams(currentConfig)
      saveTimeout = null
    }, 100) // Reduced to 100ms for faster updates, still prevents flickering
  }

  // Watch for changes and save
  watch(
    [
      sliceCount,
      volume,
      muted,
      speedMultiplier,
      algorithmId,
      completionAudioMode,
      octaveShift,
      pitchMode,
      replay,
    ],
    () => {
      console.log("[useConfig] Config changed, algorithmId:", algorithmId.value)
      debouncedSaveConfig()
    },
  )

  return {
    sliceCount,
    volume,
    muted,
    speedMultiplier,
    algorithmId,
    completionAudioMode,
    octaveShift,
    pitchMode,
    replay,
  }
}
