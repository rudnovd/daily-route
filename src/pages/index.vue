<template>
  <section class="index-page">
    <RouteMap ref="mapElement" />
    <div class="route">
      <QrElement class="route__placeholder" v-if="!isMobile && isOnboardingFinished && isStartButtonAvailable" />
      <WalkerLoading v-else-if="isMapLoading" class="route__placeholder">
        {{ $t('index.loadingMap') }}...
      </WalkerLoading>
      <WalkerLoading v-else-if="isDailyRouteGenerating" class="route__placeholder">
        {{ $t('index.generateRoute') }}...
      </WalkerLoading>
      <div v-else-if="!userStore.dailyRouteStartPosition" class="route__placeholder">
        <span>{{ $t('index.startNotSet') }}</span>
        <router-link v-wave class="button-link button-primary" to="/settings/edit?target=start">
          {{ $t('index.setStart') }}
        </router-link>
      </div>
      <div v-else-if="!userStore.radiusBbox" class="route__placeholder">
        <span>{{ $t('index.radiusNotSet') }}</span>
        <router-link v-wave class="button-primary button-link" to="/settings/edit?target=radius">
          {{ $t('index.setRadius') }}
        </router-link>
      </div>
      <div v-else-if="routeStore.isDailyRouteCompleted" class="route__completed-route">
        <div class="completed-route__title">
          <template v-if="routeStore.lastRoute?.status === 'finished'">
            {{ $t('index.dailyRouteFinished') }}
            <Icon icon="mdi:check-bold" class="check-icon" />
          </template>
          <template v-else-if="routeStore.lastRoute?.status === 'frozen'">
            {{ $t('index.dailyRouteFrozen') }}
            <Icon icon="mdi:snowfall" class="snowfall-icon" />
          </template>
          <template v-else-if="routeStore.lastRoute?.status === 'canceled'">
            {{ $t('index.dailyRouteCanceled') }}
            <Icon icon="mdi:close-thick" class="close-icon" />
          </template>
        </div>
        <span>
          {{ $t('index.comeBackTomorrow') }}
        </span>
      </div>
      <div v-else-if="isFarFromStartPoint" class="route__far-from-start-placeholder">
        <div class="walk-container">
          <Icon icon="mdi:walk" />
          <span class="walk-container__road" />
          <Icon icon="mdi:map-marker" class="color-accent" />
        </div>
        <span>
          {{ $t('index.tooFarFromStart') }}
        </span>
      </div>
      <div v-else-if="routeStore.isStartedStatus(routeStore.status)" class="route__started-route">
        <div class="tabular-num stopwatch-text">
          {{ stopwatch.value }}
        </div>
        <RouteProgress />
        <ButtonTransitionIcon
          v-if="isFinishButtonAvailable"
          :disabled="!userStore.isOnline"
          class="button-success"
          @transitionend="finishDailyRoute"
        >
          {{ $t('index.buttons.finishDailyRoute') }}
        </ButtonTransitionIcon>
        <RouteController v-else />
      </div>
      <div v-else-if="isStartButtonAvailable" class="route__start-button-container">
        <ButtonTransitionIcon
          :disabled="isDailyRouteGenerating || !userStore.isOnline"
          class="button-primary route__start-button"
          data-onboarding-element="start-daily-route-button"
          @transitionend="generateDailyRoute"
        >
          {{ $t('index.buttons.startDailyRoute') }}
        </ButtonTransitionIcon>
      </div>
    </div>
    <RouteConfirmationDialog v-if="isPreviewRouteModalActive" v-model="isPreviewRouteModalActive" />
  </section>
</template>

<script setup lang="ts">
import type { UserRoute } from '@/types/route'
import { Icon } from '@iconify/vue'
import { LngLat } from '@maptiler/sdk'
import { randomPoint } from '@turf/turf'
import { whenever } from '@vueuse/core'
import { computed, defineAsyncComponent, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { getUserRoutes } from '@/api/userRoute'
import ButtonTransitionIcon from '@/components/ButtonTransitionIcon.vue'
import RouteController from '@/components/route/RouteController.vue'
import RouteMap from '@/components/route/RouteMap.vue'
import RouteProgress from '@/components/route/RouteProgress.vue'
import WalkerLoading from '@/components/WalkerLoading.vue'
import { useGeolocation } from '@/composables/useGeolocation'
import { useStopwatch } from '@/composables/useStopwatch'
import { IS_ONBOARDING_FINISHED_KEY } from '@/constants/onboarding'
import { useRouteStore } from '@/stores/route'
import { useUserStore } from '@/stores/user'

definePage({ meta: { title: 'index.title', hideTopPadding: true } })

const RouteConfirmationDialog = defineAsyncComponent(() => import('@/components/route/RouteConfirmationDialog.vue'))
const QrElement = defineAsyncComponent(() => import('@/components/QrElement.vue'))

const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent)
const isOnboardingFinished = localStorage.getItem(IS_ONBOARDING_FINISHED_KEY) === 'true'

const routeStore = useRouteStore()
const mapRef = useTemplateRef('mapElement')
const isMapLoading = ref<boolean>(!mapRef.value?.isReady)
whenever(() => mapRef.value?.isReady, () => {
  isMapLoading.value = false
}, { once: true })
const stopwatch = useStopwatch()

const userStore = useUserStore()
const router = useRouter()
const { position } = useGeolocation()
const MIN_DISTANCE_TO_START = 100
const isFarFromStartPoint = computed<boolean>(() => {
  if (routeStore.state && routeStore.isStartedStatus(routeStore.state.status)) {
    return false
  }
  if (!mapRef.value?.isReady || !userStore.dailyRouteStartPosition) {
    return true
  }
  const [longitude, latitude] = userStore.dailyRouteStartPosition
  const startPositionLngLat = new LngLat(longitude, latitude)
  const geolocationPointLngLat = new LngLat(position.value.coords.longitude, position.value.coords.latitude)
  return startPositionLngLat.distanceTo(geolocationPointLngLat) >= MIN_DISTANCE_TO_START
})
const isStartButtonAvailable = computed<boolean>(() => {
  const hasStartPositionAndRadius = !!userStore.dailyRouteStartPosition && !!userStore.radiusBbox
  if (!mapRef.value?.isReady || !hasStartPositionAndRadius || routeStore.isDailyRouteCompleted) {
    return false
  }
  return !isFarFromStartPoint.value
})
const isFinishButtonAvailable = computed<boolean>(() => {
  if (!mapRef.value || !routeStore.startPosition || !routeStore.finishPosition || routeStore.status !== 'started') {
    return false
  }
  return routeStore.completedPercent >= 90
})
const isDailyRouteGenerating = ref<boolean>(false)
async function generateDailyRoute() {
  if (!userStore.isAuthenticated) {
    return router.push('/profile/signin')
  }
  else if (!userStore.dailyRouteStartPosition) {
    toast.error('Start point not set')
    throw new Error('Start point not set')
  }
  else if (!userStore.radiusBbox) {
    toast.error('Start point not set')
    throw new Error('Start point not set')
  }
  try {
    isDailyRouteGenerating.value = true
    const lastRoutes = await getUserRoutes(1)
    if (lastRoutes?.length && lastRoutes[0].started_at) {
      const now = Temporal.PlainDate.from(Temporal.Now.plainDateTimeISO())
      const startedAt = Temporal.PlainDate.from(lastRoutes[0].started_at)
      if (startedAt.until(now).days === 0) {
        throw new Error('Already completed today')
      }
    }
    const randomPointResult = randomPoint(1, { bbox: userStore.radiusBbox })
    const finishPoint = randomPointResult.features.at(0)?.geometry
    if (!finishPoint) {
      toast.error('Failed to generate random point, try again')
      throw new Error('Failed to generate random point')
    }
    const newRoute: Partial<UserRoute> = {
      start_geometry: { type: 'Point', coordinates: userStore.dailyRouteStartPosition },
      finish_geometry: { type: 'Point', coordinates: finishPoint.coordinates },
    }
    await routeStore.createRoute(newRoute)
    await routeStore.calculateCurrentRoutePath()
  }
  finally {
    isDailyRouteGenerating.value = false
  }
}
const isControlsLoading = ref<boolean>(false)
const { t } = useI18n()
async function finishDailyRoute() {
  if (!routeStore.state) {
    return
  }
  isControlsLoading.value = true
  try {
    await routeStore.finishRoute(routeStore.state.id)
    toast.success(t('index.routeCompleted'))
  }
  finally {
    isControlsLoading.value = false
  }
}
const isPreviewRouteModalActive = ref<boolean>(false)
watch(() => routeStore.status, (newStatus) => {
  if (newStatus === 'generated') {
    isPreviewRouteModalActive.value = true
    if (!routeStore.path) {
      routeStore.calculateCurrentRoutePath()
    }
  }

  if (newStatus === 'started') {
    stopwatch.start()
  }
  else if (newStatus === 'paused') {
    stopwatch.stop()
  }
  else if (!newStatus || newStatus === 'canceled' || newStatus === 'finished') {
    stopwatch.reset()
  }
}, { immediate: true })
</script>

<style>
.index-page {
  display: grid;
  gap: 0.5rem;
  .route {
    padding-inline: var(--content-padding-inline);
    overflow: auto;
    scrollbar-width: thin;
  }
  .route,
  .route > div {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  .route__placeholder {
    align-items: center;
    text-wrap-style: pretty;
    .button-link {
      width: 100%;
    }
  }
  .route__started-route {
    .stopwatch-text {
      font-size: 3rem;
      text-align: center;
      letter-spacing: 2px;
    }
  }
  .route__completed-route {
    align-items: center;
    .completed-route__title {
      svg {
        width: 1em;
        height: 1em;
      }
      .check-icon {
        color: var(--color-success);
      }
      .snowfall-icon {
        color: var(--color-primary);
      }
      .close-icon {
        color: var(--color-error);
      }
    }
  }
  .route__far-from-start-placeholder {
    text-align: center;
    .walk-container {
      display: grid;
      grid-template-columns: auto 1fr auto;
      .walk-container__road {
        border-bottom: 5px dotted var(--color-text);
      }
    }
  }
  .route__start-button-container .route__start-button {
    width: 100%;
  }
}
</style>
