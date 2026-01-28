<template>
  <div class="route-progress">
    <div class="route-progress__icons">
      <MdiMapMarkerIcon class="color-accent" />
      <MdiWalkIcon class="icon-walk" />
      <MdiMapMarkerIcon class="color-success" />
    </div>
    <div class="route-progress_progress">
      <progress :max="100" :value="displayedProgress" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import MdiMapMarkerIcon from '~icons/mdi/map-marker'
import MdiWalkIcon from '~icons/mdi/walk'
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
