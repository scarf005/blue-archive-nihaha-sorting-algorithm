<template>
  <div v-if="visible" class="paused-overlay">
    <div class="paused-text">PAUSED</div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean
}>()
</script>

<style scoped>
.paused-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 50;
}

.paused-text {
  color: rgba(255, 255, 255, 0.3);
  font-size: 48px;
  font-weight: bold;
  font-family: monospace;
  user-select: none;
}

@media (max-width: 768px) {
  .paused-text {
    font-size: 36px;
  }
}
</style>
