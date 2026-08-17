<template>
  <div class="walker-loading">
    <Icon icon="mdi:walk" class="walk-icon" />
    <slot />
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
</script>

<style>
@keyframes scale-walk-icon-animation {
  from {
    transform: scale(0.7);
  }
  to {
    transform: scale(1);
  }
}
.walker-loading {
  .walk-icon {
    animation: scale-walk-icon-animation 1s infinite alternate;
  }
}
</style>
