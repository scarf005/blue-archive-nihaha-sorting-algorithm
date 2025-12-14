<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue"
import Menu from "./components/Menu.vue"
import PausedOverlay from "./components/PausedOverlay.vue"
import StatsOverlay from "./components/StatsOverlay.vue"
import { AudioEngine } from "./audio"
import { CanvasRenderer } from "./renderer"
import { algorithms } from "./algorithms"
import type { SortGenerator } from "./algorithms"
import { useConfig } from "./composables/useConfig"
import img from "./assets/nihaha.jpg"
import audio from "./assets/nihaha.ogg"

// Configuration
const config = useConfig()

// UI State
const menuVisible = ref(false)
const statsVisible = ref(true)
// Cache algorithm label to prevent flickering during transitions
const currentAlgorithmLabel = ref("")

// Canvas and rendering
const canvasRef = ref<HTMLCanvasElement | null>(null)
let renderer: CanvasRenderer | null = null
let audioEngine: AudioEngine | null = null

// Sorting state
enum Phase {
  UNSORTING, // 추가된 단계: 섞기
  SORTING,
  COMPLETION,
}

let currentPhase = Phase.UNSORTING
let sortGenerator: SortGenerator | null = null
// Unsort용 제너레이터 추가 (타입은 SortGenerator와 유사하게 사용)
let unsortGenerator: SortGenerator | null = null
let currentArray: number[] = []
let animationFrameId: number | null = null
let isPaused = false
let completionSweepIndex = 0
let completionStartTime = 0
let completionDuration = 0
let transitionTimeoutId: number | null = null

// Get current algorithm
const currentAlgorithm = computed(() =>
  algorithms.find((a) => a.id === config.algorithmId.value) || algorithms[0]
)

// Get optimal slice count based on algorithm complexity
const optimalSliceCount = computed(() => {
  const multiplier = currentAlgorithm.value.complexityMultiplier
  const scaledSize = Math.floor(config.sliceCount.value * multiplier)
  return Math.max(16, scaledSize)
})

// Fisher-Yates shuffle generator for visualization
function* createShuffleGenerator(arr: number[]): SortGenerator {
  const n = arr.length
  const stats = { comparisons: 0, arrayAccesses: 0, swaps: 0 }

  // 뒤에서부터 앞으로 오면서 랜덤하게 섞음
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
    stats.swaps++
    stats.arrayAccesses += 2

    // 시각화를 위해 상태 반환 (swapping 하이라이트)
    yield {
      array: arr,
      comparing: [],
      swapping: [i, j],
      comparisons: 0,
      arrayAccesses: stats.arrayAccesses,
      swaps: stats.swaps,
    }
  }
}

// Start Unsorting Phase (Initialize & Shuffle)
const startUnsortingPhase = (): void => {
  // Clear transition timeout
  if (transitionTimeoutId !== null) {
    clearTimeout(transitionTimeoutId)
    transitionTimeoutId = null
  }

  currentPhase = Phase.UNSORTING

  // 1. Update Algorithm Label immediately
  currentAlgorithmLabel.value =
    `${currentAlgorithm.value.nameKorean} (${currentAlgorithm.value.name})`

  // 2. Initialize Array with new size (Sorted state 0..N)
  const count = optimalSliceCount.value
  console.log("[startUnsortingPhase] Initializing array with count:", count)
  currentArray = Array.from({ length: count }, (_, i) => i)

  // 3. Update Renderer
  if (renderer) {
    renderer.setSliceCount(count)
    // Render the sorted state immediately (clean slate)
    renderer.render(currentArray, [], [])
  }

  // 4. Create Shuffle Generator
  unsortGenerator = createShuffleGenerator(currentArray)

  // Reset stats
  currentStats.value = { comparisons: 0, arrayAccesses: 0, swaps: 0 }
  comparingIndices.value = []
  swappingIndices.value = []
}

// Start Sorting Phase (Actually run the sort algorithm)
const startSortingPhase = (): void => {
  console.log("[startSortingPhase] Starting sort logic")
  currentPhase = Phase.SORTING

  // Create Sort Generator with the ALREADY shuffled array
  sortGenerator = currentAlgorithm.value.sort(currentArray)

  sortingStartTime = performance.now()
}

// Start completion phase
const startCompletionPhase = async (): Promise<void> => {
  currentPhase = Phase.COMPLETION
  completionSweepIndex = 0
  completionStartTime = performance.now()

  if (audioEngine) {
    if (config.completionAudioMode.value === "full") {
      await audioEngine.resume()
      completionDuration = audioEngine.playFullAudio() * 1000
    } else {
      completionDuration = audioEngine.getAudioDuration() * 1000
    }
  }
}

// Move to next algorithm logic
const moveToNextAlgorithm = (): void => {
  if (config.replay.value) {
    console.log("[moveToNextAlgorithm] Replaying:", config.algorithmId.value)
    // Same algorithm, just restart unsorting
    startUnsortingPhase()
  } else {
    // Next algorithm
    const currentIndex = algorithms.findIndex((a) =>
      a.id === config.algorithmId.value
    )
    const nextIndex = (currentIndex + 1) % algorithms.length
    config.algorithmId.value = algorithms[nextIndex].id

    // Start Unsorting with new algorithm settings
    startUnsortingPhase()
  }
}

// Stats tracking
const currentStats = ref({ comparisons: 0, arrayAccesses: 0, swaps: 0 })
const lastFrameTime = ref(performance.now())
const frameTime = ref(0)
const elapsedTime = ref(0)
const comparingIndices = ref<number[]>([])
const swappingIndices = ref<number[]>([])
let sortingStartTime = 0

// Main animation loop
const animate = (timestamp: number): void => {
  if (isPaused) {
    animationFrameId = requestAnimationFrame(animate)
    return
  }

  // --- PHASE 1: UNSORTING (Shuffle Animation) ---
  if (currentPhase === Phase.UNSORTING && unsortGenerator) {
    // Shuffle can be faster than sorting
    const stepsPerFrame = Math.max(
      5,
      Math.floor(config.speedMultiplier.value * 5),
    )
    let lastState = null
    let stepCount = 0

    while (stepCount < stepsPerFrame) {
      const result = unsortGenerator.next()
      if (result.done) {
        // Shuffle complete -> Start Sorting
        startSortingPhase()
        lastState = null // Prevent rendering done state here
        break
      } else {
        lastState = result.value
        stepCount++
      }
    }

    if (lastState && currentPhase === Phase.UNSORTING) {
      renderer?.render(lastState.array, [], lastState.swapping)

      // Play chaotic sound for shuffling
      if (audioEngine && lastState.swapping.length > 0) {
        // Random pitch for chaos effect
        const randomVal = Math.floor(Math.random() * optimalSliceCount.value)
        audioEngine.playChoppedSound(
          randomVal,
          optimalSliceCount.value,
          config.speedMultiplier.value * 2,
        )
      }
    }
  } // --- PHASE 2: SORTING ---
  else if (currentPhase === Phase.SORTING && sortGenerator) {
    const stepsPerFrame = Math.max(
      1,
      Math.floor(config.speedMultiplier.value),
    )

    let lastState = null
    let stepCount = 0

    while (stepCount < stepsPerFrame) {
      const result = sortGenerator.next()

      if (result.done) {
        startCompletionPhase()
        break
      } else {
        lastState = result.value
        currentStats.value = {
          comparisons: lastState.comparisons,
          arrayAccesses: lastState.arrayAccesses,
          swaps: lastState.swaps,
        }
        stepCount++
      }
    }

    if (lastState) {
      renderer?.render(lastState.array, lastState.comparing, lastState.swapping)

      elapsedTime.value = (timestamp - sortingStartTime) / 1000
      frameTime.value = timestamp - lastFrameTime.value
      comparingIndices.value = lastState.comparing
      swappingIndices.value = lastState.swapping

      if (
        audioEngine &&
        (lastState.comparing.length > 0 || lastState.swapping.length > 0)
      ) {
        const indices = [...lastState.comparing, ...lastState.swapping]
        for (const idx of indices) {
          audioEngine.playChoppedSound(
            currentArray[idx],
            optimalSliceCount.value - 1,
            config.speedMultiplier.value,
            idx,
          )
        }
      }
    }
  } // --- PHASE 3: COMPLETION ---
  else if (currentPhase === Phase.COMPLETION) {
    const elapsed = performance.now() - completionStartTime
    const progress = Math.min(elapsed / completionDuration, 1)
    const newSweepIndex = Math.floor(progress * currentArray.length)

    if (
      config.completionAudioMode.value === "chopped" &&
      newSweepIndex > completionSweepIndex && audioEngine &&
      newSweepIndex < currentArray.length
    ) {
      audioEngine.playChoppedSoundSubtle(
        currentArray[newSweepIndex],
        optimalSliceCount.value - 1,
        1.0,
        newSweepIndex,
      )
    }

    completionSweepIndex = newSweepIndex
    renderer?.renderCompletionSweep(currentArray, completionSweepIndex)

    elapsedTime.value = (timestamp - sortingStartTime) / 1000
    frameTime.value = 0
    comparingIndices.value = []
    swappingIndices.value = []

    // Transition to next algorithm (UNSORTING phase)
    if (progress >= 1 && transitionTimeoutId === null) {
      transitionTimeoutId = setTimeout(() => {
        moveToNextAlgorithm()
        transitionTimeoutId = null
      }, 500) as unknown as number
    }
  }

  lastFrameTime.value = timestamp
  animationFrameId = requestAnimationFrame(animate)
}

// Handle key press
const handleKeyPress = (e: KeyboardEvent): void => {
  if (e.key === "Escape") {
    if (menuVisible.value) {
      menuVisible.value = false
      isPaused = false
      if (audioEngine) {
        audioEngine.resume()
      }
    } else {
      menuVisible.value = true
      isPaused = true
      audioEngine?.stopCurrentSound()
    }
  }
}

// Handle resize
const handleResize = (): void => {
  renderer?.resize()
  if (!isPaused) {
    if (currentPhase === Phase.UNSORTING || currentPhase === Phase.SORTING) {
      renderer?.render(currentArray, [], [])
    } else if (currentPhase === Phase.COMPLETION) {
      renderer?.renderCompletionSweep(currentArray, completionSweepIndex)
    }
  }
}

// Menu handlers
const handleSelectAlgorithm = (algorithmId: string): void => {
  config.algorithmId.value = algorithmId
  startUnsortingPhase() // Start from Unsorting
}

const handleUpdateSliceCount = (count: number): void => {
  config.sliceCount.value = count
  startUnsortingPhase() // Restart with new slice count
}

const handleUpdateVolume = (volume: number): void => {
  config.volume.value = volume
  if (audioEngine) {
    audioEngine.volume = volume
  }
}

const handleUpdateMuted = (muted: boolean): void => {
  config.muted.value = muted
  if (audioEngine) {
    audioEngine.muted = muted
  }
}

const handleUpdateSpeed = (speed: number): void => {
  config.speedMultiplier.value = speed
}

const handleUpdateCompletionAudioMode = (mode: "full" | "chopped"): void => {
  config.completionAudioMode.value = mode
}

const handleUpdateOctaveShift = (octaveShift: number): void => {
  config.octaveShift.value = octaveShift
  if (audioEngine) {
    audioEngine.octaveShift = octaveShift
  }
}

const handleUpdatePitchMode = (mode: "value" | "position"): void => {
  config.pitchMode.value = mode
  if (audioEngine) {
    audioEngine.pitchMode = mode
  }
}

const handleUpdateReplay = (replay: boolean): void => {
  config.replay.value = replay
}

const handleCloseMenu = (): void => {
  menuVisible.value = false
  isPaused = false
  if (audioEngine) {
    audioEngine.resume()
  }
}

// Lifecycle
onMounted(async () => {
  if (!canvasRef.value) return

  renderer = new CanvasRenderer(canvasRef.value, img, optimalSliceCount.value)
  await renderer.loadImage()

  audioEngine = new AudioEngine(audio)
  await audioEngine.initialize()
  audioEngine.volume = config.volume.value
  audioEngine.muted = config.muted.value
  audioEngine.octaveShift = config.octaveShift.value
  audioEngine.pitchMode = config.pitchMode.value

  if (audioEngine.isAudioBlocked()) {
    isPaused = true
    console.log(
      "[App] Audio blocked by browser, pausing until user interaction",
    )
  }

  const resumeAudio = async () => {
    if (audioEngine?.isAudioBlocked()) {
      await audioEngine.resume()
      if (isPaused) {
        isPaused = false
      }
    }
    document.removeEventListener("click", resumeAudio)
    document.removeEventListener("keydown", resumeAudio)
  }
  document.addEventListener("click", resumeAudio)
  document.addEventListener("keydown", resumeAudio)

  // Start with Unsorting Phase
  startUnsortingPhase()

  animationFrameId = requestAnimationFrame(animate)

  globalThis.addEventListener("keydown", handleKeyPress)
  globalThis.addEventListener("resize", handleResize)
})

onUnmounted(() => {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
  }
  audioEngine?.dispose()
  globalThis.removeEventListener("keydown", handleKeyPress)
  globalThis.removeEventListener("resize", handleResize)
})
</script>

<template>
  <div class="app">
    <canvas
      ref="canvasRef"
      class="canvas"
      @click="
        () => {
          isPaused = !isPaused
          if (isPaused) {
            audioEngine?.stopCurrentSound()
          } else if (audioEngine) {
            audioEngine.resume()
          }
        }
      "
    ></canvas>

    <PausedOverlay :visible="isPaused && !menuVisible" />

    <StatsOverlay
      :visible="statsVisible"
      :stats="currentStats"
      :frame-time="frameTime"
      :array-length="currentArray.length"
      :time-complexity="currentAlgorithm.timeComplexity"
      :comparing="comparingIndices"
      :swapping="swappingIndices"
      :elapsed-time="elapsedTime"
    />

    <div
      class="algorithm-label"
      @click="
        () => {
          menuVisible = true
          isPaused = true
          audioEngine?.stopCurrentSound()
        }
      "
    >
      {{ currentAlgorithmLabel }}
    </div>

    <div
      class="stats-toggle"
      @click="
        () => {
          if (menuVisible) {
            menuVisible = false
            isPaused = false
            if (audioEngine) {
              audioEngine.resume()
            }
          } else {
            menuVisible = true
            isPaused = true
            audioEngine?.stopCurrentSound()
          }
        }
      "
      :title='menuVisible ? "Close menu (ESC)" : "Open menu (ESC)"'
    >
    </div>

    <Menu
      :visible="menuVisible"
      :current-algorithm-id="config.algorithmId.value"
      :slice-count="config.sliceCount.value"
      :volume="config.volume.value"
      :muted="config.muted.value"
      :speed-multiplier="config.speedMultiplier.value"
      :completion-audio-mode="config.completionAudioMode.value"
      :octave-shift="config.octaveShift.value"
      :pitch-mode="config.pitchMode.value"
      :replay="config.replay.value"
      @close="handleCloseMenu"
      @select-algorithm="handleSelectAlgorithm"
      @update-slice-count="handleUpdateSliceCount"
      @update-volume="handleUpdateVolume"
      @update-muted="handleUpdateMuted"
      @update-speed="handleUpdateSpeed"
      @update-completion-audio-mode="handleUpdateCompletionAudioMode"
      @update-octave-shift="handleUpdateOctaveShift"
      @update-pitch-mode="handleUpdatePitchMode"
      @update-replay="handleUpdateReplay"
    />
  </div>
</template>

<style scoped>
.app {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

.canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.algorithm-label {
  position: fixed;
  top: 16px;
  right: 16px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 0.5rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  font-size: 1rem;
  font-weight: 500;
  font-family: monospace;
  pointer-events: auto;
  cursor: pointer;
  z-index: 100;
  backdrop-filter: blur(4px);
  user-select: none;
}

.stats-toggle {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 300px;
  height: 200px;
  cursor: pointer;
  z-index: 100;
  transition: background-color 0.2s;
}

.stats-toggle:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

@media (max-width: 768px) {
  .algorithm-label {
    top: 8px;
    right: 8px;
    left: 8px;
    font-size: 0.85rem;
    padding: 0.4rem 0.75rem;
    text-align: center;
  }
}
</style>
