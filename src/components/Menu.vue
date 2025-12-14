<script setup lang="ts">
import { computed, ref } from "vue"
import { algorithms } from "../algorithms"
import type { Algorithm } from "../algorithms"

const props = defineProps<{
  visible: boolean
  currentAlgorithmId: string
  sliceCount: number
  volume: number
  muted: boolean
  speedMultiplier: number
  completionAudioMode: "full" | "chopped"
  octaveShift: number
  pitchMode: "value" | "position"
  replay: boolean
}>()

const emit = defineEmits<{
  close: []
  selectAlgorithm: [algorithmId: string]
  updateSliceCount: [count: number]
  updateVolume: [volume: number]
  updateMuted: [muted: boolean]
  updateSpeed: [speed: number]
  updateCompletionAudioMode: [mode: "full" | "chopped"]
  updateOctaveShift: [octaveShift: number]
  updatePitchMode: [mode: "value" | "position"]
  updateReplay: [replay: boolean]
}>()

const sliceCountInput = ref(props.sliceCount)
const volumeInput = ref(Math.round(props.volume * 100))
const mutedInput = ref(props.muted)
const speedInput = ref(props.speedMultiplier)
const completionAudioModeInput = ref(props.completionAudioMode)
const octaveShiftInput = ref(props.octaveShift)
const pitchModeInput = ref(props.pitchMode)
const replayInput = ref(props.replay)

const currentAlgorithm = computed(() =>
  algorithms.find((a) => a.id === props.currentAlgorithmId)
)

const selectAlgorithm = (algo: Algorithm) => {
  emit("selectAlgorithm", algo.id)
  emit("close")
}

const updateSettings = () => {
  emit("updateSliceCount", sliceCountInput.value)
  emit("updateVolume", volumeInput.value / 100)
  emit("updateMuted", mutedInput.value)
  emit("updateSpeed", speedInput.value)
  emit("updateCompletionAudioMode", completionAudioModeInput.value)
  emit("updateOctaveShift", octaveShiftInput.value)
  emit("updatePitchMode", pitchModeInput.value)
  emit("updateReplay", replayInput.value)
}

const close = () => {
  emit("close")
}
</script>

<template>
  <div v-if="visible" class="menu-overlay" @click.self="close">
    <div class="menu">
      <a
        class="github-link-corner"
        href="https://github.com/scarf005/blue-archive-nihaha-sorting-algorithm"
        target="_blank"
        rel="noopener noreferrer"
      >
        <svg
          class="octicon"
          viewBox="0 0 16 16"
          width="16"
          height="16"
          aria-hidden="true"
        >
          <path
            d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"
          >
          </path>
        </svg>
        GitHub
      </a>

      <div class="menu-content">
        <div class="menu-section menu-left">
          <h2>알고리즘 선택</h2>
          <div class="algorithm-list">
            <button
              v-for="algo in algorithms"
              :key="algo.id"
              class="algorithm-button"
              :class="{ active: algo.id === currentAlgorithmId }"
              @click="selectAlgorithm(algo)"
            >
              {{ algo.nameKorean }} ({{ algo.name }})
            </button>
          </div>
        </div>

        <div class="menu-section menu-right">
          <div class="settings-content">
            <h2>설정</h2>

            <div class="setting">
              <label for="slice-count">이미지 조각 수 (기본)</label>
              <input
                id="slice-count"
                v-model.number="sliceCountInput"
                type="number"
                min="16"
                max="2048"
                step="16"
                @change="updateSettings"
              />
            </div>

            <div class="setting">
              <label for="volume">볼륨</label>
              <div class="volume-control">
                <input
                  id="volume"
                  v-model.number="volumeInput"
                  type="range"
                  min="0"
                  max="100"
                  :disabled="mutedInput"
                  @input="updateSettings"
                />
                <span>{{ volumeInput }}%</span>
                <label class="checkbox-label">
                  <input
                    v-model="mutedInput"
                    type="checkbox"
                    @change="updateSettings"
                  />
                  음소거
                </label>
              </div>
            </div>

            <div class="setting">
              <label for="speed">속도 배율</label>
              <div class="speed-control">
                <input
                  id="speed"
                  v-model.number="speedInput"
                  type="range"
                  min="0.1"
                  max="16"
                  step="0.1"
                  @input="updateSettings"
                />
                <span>{{ speedInput.toFixed(1) }}x</span>
              </div>
            </div>

            <div class="setting">
              <label for="completion-audio">완료 단계 오디오</label>
              <select
                id="completion-audio"
                v-model="completionAudioModeInput"
                @change="updateSettings"
              >
                <option value="full">전체 재생</option>
                <option value="chopped">조각 재생</option>
              </select>
            </div>

            <div class="setting">
              <label for="octave-shift">옥타브 이동</label>
              <div class="speed-control">
                <input
                  id="octave-shift"
                  v-model.number="octaveShiftInput"
                  type="range"
                  min="-1.5"
                  max="1.5"
                  step="0.1"
                  @input="updateSettings"
                />
                <span>{{ octaveShiftInput.toFixed(1) }}</span>
              </div>
            </div>

            <div class="setting">
              <label for="pitch-mode">피치 모드</label>
              <select
                id="pitch-mode"
                v-model="pitchModeInput"
                @change="updateSettings"
              >
                <option value="value">값 기반</option>
                <option value="position">위치 기반</option>
              </select>
            </div>

            <div class="setting">
              <label class="checkbox-label">
                <input
                  v-model="replayInput"
                  type="checkbox"
                  @change="updateSettings"
                />
                완료 후 같은 알고리즘 반복
              </label>
            </div>
          </div>

          <div class="bottom-section">
            <div class="current-algorithm">
              <strong>현재:</strong> {{ currentAlgorithm?.nameKorean }} ({{
                currentAlgorithm?.name
              }})
            </div>

            <button class="close-button" @click="close">
              닫기 (ESC)
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Minimalistic Black & White Menu */
.menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.menu {
  background: #000;
  border: 2px solid #fff;
  padding: 2rem;
  max-width: 1000px;
  width: 90vw;
  max-height: 95vh;
  color: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.menu-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

@media (max-width: 768px) {
  .menu {
    padding: 1.5rem;
    width: 95vw;
  }

  .menu-content {
    grid-template-columns: 1fr;
  }

  .menu-title {
    font-size: 1.2rem;
  }

  .algorithm-list {
    max-height: 300px;
  }

  .algorithm-button {
    font-size: 0.85rem;
    padding: 0.4rem 0.6rem;
  }

  .setting {
    padding: 0.5rem;
  }

  .setting label {
    font-size: 0.85rem;
  }

  .volume-control,
  .speed-control {
    flex-wrap: wrap;
  }

  .github-link-corner {
    font-size: 0.8rem;
    padding: 0.4rem 0.6rem;
  }
}

.github-link-corner {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  color: #888;
  text-decoration: none;
  border: none;
  padding: 0.5rem 1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
}

.octicon {
  fill: currentColor;
  vertical-align: middle;
}

.menu-section {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.menu-left {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.menu-right {
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.settings-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
  padding-right: 0.5rem;
}

.bottom-section {
  flex-shrink: 0;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #444;
}

.menu-section h2 {
  font-size: 1.1rem;
  margin: 0 0 0.75rem 0;
  font-weight: 500;
  border-bottom: 1px solid #444;
  padding-bottom: 0.5rem;
  flex-shrink: 0;
}

.algorithm-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  overflow-y: auto;
  padding: 0.5rem;
  border: 1px solid #444;
  flex: 1;
  min-height: 0;
}

.algorithm-button {
  padding: 0.5rem 0.75rem;
  background: #000;
  border: 1px solid #666;
  color: #fff;
  cursor: pointer;
  text-align: left;
  font-size: 0.9rem;
}

.algorithm-button:hover {
  background: #333;
  border-color: #999;
}

.algorithm-button.active {
  background: #fff;
  color: #000;
  border-color: #fff;
  font-weight: 600;
}

.setting {
  margin-bottom: 1rem;
  padding: 0.75rem;
  border: 1px solid #444;
}

.setting label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  font-size: 0.9rem;
}

.setting input[type="number"],
.setting select {
  width: 100%;
  padding: 0.5rem;
  background: #000;
  border: 1px solid #666;
  color: #fff;
  font-size: 1rem;
  cursor: pointer;
}

.setting select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23fff' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.5rem center;
  padding-right: 2rem;
}

.volume-control,
.speed-control {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.volume-control input[type="range"],
.speed-control input[type="range"] {
  flex: 1;
}

.volume-control span,
.speed-control span {
  min-width: 50px;
  text-align: center;
  font-weight: 500;
  font-family: monospace;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: normal;
  cursor: pointer;
  white-space: nowrap;
  margin: 0;
}

.checkbox-label input[type="checkbox"] {
  cursor: pointer;
  margin: 0;
  width: 1.2rem;
  height: 1.2rem;
}

.setting label:hover {
  color: #ccc;
}

.checkbox-label:hover {
  color: #ccc;
}

.current-algorithm {
  padding: 0.75rem;
  border: 1px solid #fff;
  text-align: center;
  margin-bottom: 1rem;
  font-size: 0.95rem;
  font-family: monospace;
}

.close-button {
  width: 100%;
  padding: 0.75rem;
  background: #fff;
  border: 1px solid #fff;
  color: #000;
  font-weight: 600;
  cursor: pointer;
  font-size: 1rem;
}

/* Scrollbar styling */
.algorithm-list::-webkit-scrollbar,
.settings-content::-webkit-scrollbar,
.menu::-webkit-scrollbar {
  width: 8px;
}

.algorithm-list::-webkit-scrollbar-track,
.settings-content::-webkit-scrollbar-track,
.menu::-webkit-scrollbar-track {
  background: #000;
  border: 1px solid #444;
}

.algorithm-list::-webkit-scrollbar-thumb,
.settings-content::-webkit-scrollbar-thumb,
.menu::-webkit-scrollbar-thumb {
  background: #666;
}
</style>
