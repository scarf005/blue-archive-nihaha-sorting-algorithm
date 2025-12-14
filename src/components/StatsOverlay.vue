<template>
  <div v-if="visible" class="stats-overlay">
    <div class="stats-content">
      <div class="stats-line">
        {{ timeComplexity }} | {{ arrayLength }} segments
      </div>
      <div class="stats-line">Comparisons: {{ stats.comparisons }}</div>
      <div class="stats-line">Array Accesses: {{ stats.arrayAccesses }}</div>
      <div class="stats-line">Swaps: {{ stats.swaps }}</div>
      <div class="stats-line">Frame: {{ frameTime.toFixed(2) }}ms</div>
      <div class="stats-line">Elapsed: {{ elapsedTime.toFixed(2) }}s</div>
      <!-- <div class="stats-line">
        Compare: [{{ comparingStr }}], Swap: [{{ swappingStr }}]
      </div> -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue"

const props = defineProps<{
  visible: boolean
  stats: { comparisons: number; arrayAccesses: number; swaps: number }
  frameTime: number
  arrayLength: number
  timeComplexity: string
  comparing: number[]
  swapping: number[]
  elapsedTime: number
}>()

const padLength = computed(() => props.arrayLength.toString().length)

const comparingStr = computed(() =>
  props.comparing.length > 0
    ? props.comparing.map((i) => i.toString().padStart(padLength.value, "0"))
      .join(", ")
    : "0".padStart(padLength.value, "0")
)

const swappingStr = computed(() =>
  props.swapping.length > 0
    ? props.swapping.map((i) => i.toString().padStart(padLength.value, "0"))
      .join(", ")
    : "0".padStart(padLength.value, "0")
)
</script>

<style scoped>
.stats-overlay {
  position: fixed;
  bottom: 16px;
  left: 16px;
  background: rgba(0, 0, 0, 0.7);
  color: #ffffff;
  font-family: monospace;
  font-size: 14px;
  padding: 12px 16px;
  pointer-events: none;
  user-select: none;
  z-index: 10;
  min-width: 280px;
}

.stats-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stats-line {
  line-height: 20px;
}

@media (max-width: 768px) {
  .stats-overlay {
    font-size: 12px;
    padding: 8px 12px;
    min-width: 240px;
  }
}
</style>
