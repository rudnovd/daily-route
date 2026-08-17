<template>
  <BaseDialog :model-value="model" class="route-confirmation-dialog" :closable="false" size="large">
    <div ref="mapElement" class="route-confirmation-dialog__map" />
    <div class="route-confirmation-dialog__route-data">
      <ul v-if="routePathSummaryFormatted" class="route-data-summary-list">
        <li class="route-data-summary-list__element">
          <MdiMapMarkerDistanceIcon />
          {{ $t('index.routeConfirmationDialog.distance') }}: ~{{ routePathSummaryFormatted.distance }}
        </li>
        <li class="route-data-summary-list__element">
          <MdiTimerIcon />
          {{ $t('index.routeConfirmationDialog.duration') }}: ~{{ routePathSummaryFormatted.duration }}
        </li>
      </ul>
      <div v-if="isReady" class="route-data-buttons">
        <div>
          <button class="button-error icon-button icon-button--large" @click="cancelRoute">
            <MdiCloseThickIcon />
          </button>
          {{ $t('index.routeConfirmationDialog.buttons.cancel') }}
        </div>
        <div>
          <button class="button-success icon-button icon-button--large" @click="acceptRoute">
            <MdiCheckBoldIcon />
          </button>
          {{ $t('index.routeConfirmationDialog.buttons.accept') }}
        </div>
      </div>
    </div>
  </BaseDialog>
</template>

<script setup lang="ts">
import { Marker } from '@maptiler/sdk'
import { whenever } from '@vueuse/core'
import { computed, defineAsyncComponent, nextTick, onUnmounted, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { toast } from 'vue-sonner'
import { useMap } from '@/composables/useMap'
import { getAppLocale } from '@/i18n'
import { useRouteStore } from '@/stores/route'
import { useUserStore } from '@/stores/user'
import BaseDialog from '../BaseDialog.vue'

const MdiCheckBoldIcon = defineAsyncComponent(() => import('~icons/mdi/check-bold'))
const MdiCloseThickIcon = defineAsyncComponent(() => import('~icons/mdi/close-thick'))
const MdiMapMarkerDistanceIcon = defineAsyncComponent(() => import('~icons/mdi/map-marker-distance'))
const MdiTimerIcon = defineAsyncComponent(() => import('~icons/mdi/timer'))

const model = defineModel<boolean>({ required: true })

const mapRef = useTemplateRef('mapElement')
const { isReady, map } = useMap(mapRef, { zoom: 11 })

const userStore = useUserStore()
const routeStore = useRouteStore()
let startMarker: Marker | null = null
let finishMarker: Marker | null = null
function initStartMarker() {
  if (!map.value || !userStore.dailyRouteStartPosition) {
    return
  }
  const [lng, lat] = userStore.dailyRouteStartPosition
  startMarker = new Marker({ color: '#ffcc00' })
    .setLngLat([lng, lat])
    .addTo(map.value)
}
function initFinishMarker() {
  if (!map.value || !routeStore.finishPosition) {
    return
  }
  const [lng, lat] = routeStore.finishPosition
  finishMarker = new Marker({ color: '#22c55e' }).setLngLat([lng, lat]).addTo(map.value)
}
whenever(isReady, () => {
  initStartMarker()
  initFinishMarker()
  if (finishMarker) {
    map.value?.setCenter(finishMarker.getLngLat())
  }
  nextTick(() => {
    map.value?.redraw()
  })
})
onUnmounted(() => {
  startMarker?.remove()
  finishMarker?.remove()
})

const { t } = useI18n()
function formatDistance(distance: number) {
  if (distance < 1000) {
    return `${distance} ${t('units.metersShort')}`
  }
  return `${(distance / 1000).toPrecision(2)} ${t('units.kilometersShort')}`
}
function formatDuration(seconds: number) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const hoursFormatter = new Intl.NumberFormat(getAppLocale(), {
    unit: 'hour',
    style: 'unit',
    unitDisplay: 'short',
  })
  const minutesFormatter = new Intl.NumberFormat(getAppLocale(), {
    unit: 'minute',
    style: 'unit',
    unitDisplay: 'short',
  })
  let result = ''
  if (hours) {
    result += hoursFormatter.format(hours)
  }
  if (minutes) {
    result += minutesFormatter.format(minutes)
  }
  return result
}
const routePathSummaryFormatted = computed<{ distance: string, duration: string } | null>(() => {
  if (!routeStore.path?.features.length) {
    return null
  }
  const [feature] = routeStore.path.features
  if (!feature.properties?.summary) {
    return null
  }
  return {
    distance: formatDistance(feature.properties.summary.distance),
    duration: formatDuration(feature.properties.summary.duration),
  }
})

async function cancelRoute() {
  if (!routeStore.state?.id) {
    return
  }
  try {
    routeStore.cancelRoute(routeStore.state.id)
    toast.success(t('index.routeConfirmationDialog.notifications.routeCanceled'))
    model.value = false
  }
  catch {
    toast.error(t('index.routeConfirmationDialog.notifications.failedToCancelRoute'))
  }
}

async function acceptRoute() {
  if (!routeStore.state?.id) {
    return
  }
  try {
    await routeStore.startRoute(routeStore.state.id)
    model.value = false
  }
  catch {
    toast.error(t('index.routeConfirmationDialog.notifications.failedToStartRoute'))
  }
}
</script>

<style>
.route-confirmation-dialog {
  height: 70dvh;
  .base-dialog__content {
    display: grid;
    grid-template-rows: 1fr 1fr;
    gap: 0.25rem;
  }
  .route-confirmation-dialog__route-data {
    display: flex;
    flex-direction: column;
    gap: 2rem;
    .route-data-summary-list {
      display: grid;
      gap: 0.5rem;
      justify-items: center;
      .route-data-summary-list__element {
        display: grid;
        gap: 0.25rem;
        justify-items: center;
        svg {
          width: 3rem;
          height: 3rem;
        }
      }
    }
    .route-data-buttons {
      display: grid;
      grid-template-columns: 1fr 1fr;
      width: 100%;
      user-select: none;
      div {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        align-items: center;
      }
    }
  }
}
</style>
