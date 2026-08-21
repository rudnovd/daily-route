<template>
  <div class="route-progress">
    <div class="route-progress__icons">
      <IconMapMarker class="color-accent" />
      <IconWalk class="icon-walk" />
      <IconMapMarker class="color-success" />
    </div>
    <div class="route-progress-progress-element">
      <progress :max="100" :value="displayedProgress" />
    </div>
    <div class="route-progress-finish-distance">
      {{ distanceToFinish }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import IconMapMarker from '~icons/mdi/map-marker'
import IconWalk from '~icons/mdi/walk'
import { useRouteStore } from '@/stores/route'

const routeStore = useRouteStore()

const displayedProgress = computed<number>(() => {
  if (routeStore.completedPercent >= 90) {
    return 100
  }
  return routeStore.completedPercent
})
const { t } = useI18n()
const distanceToFinish = computed<string>(() => {
  if (routeStore.completedPercent >= 90) {
    return `${t('index.nearFinish')}🏁`
  }
  const distance = routeStore.currentDistance < 1000 ? routeStore.currentDistance : routeStore.currentDistance / 1000
  if (routeStore.currentDistance < 1000) {
    return `${Math.floor(distance)} ${t('index.distanceToFinish', { distance: t('units.meters', Math.floor(distance)) })}`
  }
  return `${distance.toFixed(1)} ${t('index.distanceToFinish', { distance: t('units.kilometers', Number(distance.toFixed(0))) })}`
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
  .route-progress-progress-element {
    padding-inline: 0.75rem;
    progress {
      inline-size: 100%;
    }
  }
  .route-progress-finish-distance {
    text-align: center;
  }
}
</style>
