<template>
  <div class="route-progress">
    <div class="route-progress__icons">
      <Icon icon="mdi:map-marker" class="color-accent" />
      <Icon icon="mdi:walk" class="icon-walk" />
      <Icon icon="mdi:map-marker" class="color-success" />
    </div>
    <div class="route-progress_progress">
      <progress :max="100" :value="displayedProgress" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed } from 'vue'
import { useRouteStore } from '@/stores/route'

const routeStore = useRouteStore()

const displayedProgress = computed<number>(() => {
  if (routeStore.completedPercent >= 90) {
    return 100
  }
  return routeStore.completedPercent
})
</script>

<style>
.route-progress {
  .route-progress__icons {
    display: grid;
    grid-template-columns: auto 1fr auto;
    .icon-walk {
      transform: translateX(max(0px, calc(var(--displayed-progress) - 2rem - 1.2em - 1.2em - 1.2em)));
      transition: transform var(--duration-long);

      --displayed-progress: v-bind('`${displayedProgress}vw`');
    }
  }
  .route-progress_progress {
    padding-inline: 0.75rem;
    progress {
      inline-size: 100%;
    }
  }
}
</style>
