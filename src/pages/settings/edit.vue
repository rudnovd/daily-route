<template>
  <section class="settings-edit-page">
    <div class="setting-edit-page__map">
      <div v-if="isReady" class="map__top-container">
        <button
          v-wave
          class="icon-button icon-button--medium button-primary"
          @click="moveMapToUserGeolocation"
        >
          <IconNavigation />
        </button>
      </div>
      <div ref="mapElement" class="map" data-onboarding-element="map-container" />
    </div>
    <div v-if="isReady" class="setting-edit-page__data">
      <template v-if="target === 'radius'">
        <div class="setting-edit-page__data-radius">
          ~
          <span class="tabular-num">{{ radiusMeters }}</span>
          {{ $t('settings.radius.meters') }}
        </div>
      </template>
      <button v-wave class="button-primary" data-onboarding-element="save-target-button" @click="saveTarget">
        {{ target === 'start' ? $t('settings.startPoint.buttons.saveStart') : $t('settings.radius.buttons.saveRadius') }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { GeoJSONSource, Subscription } from '@maptiler/sdk'
import type { BBox } from 'geojson'
import { Marker } from '@maptiler/sdk'
import { bbox, circle, distance, point } from '@turf/turf'
import { whenever } from '@vueuse/core'
import { computed, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import IconNavigation from '~icons/mdi/navigation'
import { useGeolocation } from '@/composables/useGeolocation'
import { useMap } from '@/composables/useMap'
import { IS_ONBOARDING_FINISHED_KEY } from '@/constants/onboarding'
import { useUserStore } from '@/stores/user'

definePage({ meta: { title: 'settings.startPoint.title', displayTitle: true } })

const router = useRouter()
const target = computed<'start' | 'radius' | null>(() => {
  const queryTarget = router.currentRoute.value.query.target
  if (typeof queryTarget === 'string' && (queryTarget === 'start' || queryTarget === 'radius')) {
    return queryTarget
  }
  return null
})
const { t } = useI18n()
watch(target, (newTarget) => {
  router.currentRoute.value.meta.title = newTarget === 'start' ? 'settings.startPoint.title' : 'settings.radius.title'
}, { immediate: true })

const mapRef = useTemplateRef('mapElement')
const minZoom = computed<number>(() => target.value === 'start' ? 8 : 9)
const INITIAL_ZOOM = computed<number>(() => target.value === 'start' ? 15 : 14)
const maxZoom = computed<number>(() => target.value === 'start' ? 18 : 14)
const { map, isReady } = useMap(mapRef, {
  zoom: INITIAL_ZOOM.value,
  minZoom: minZoom.value,
  maxZoom: maxZoom.value,
})
const { position, getPosition } = useGeolocation()
const userStore = useUserStore()
let startMarker: Marker | null = null
async function addStartMarker() {
  if (!map.value) {
    return
  }
  if (startMarker) {
    startMarker.remove()
  }
  const { coords: { longitude, latitude } } = await getPosition()
  startMarker = new Marker({ color: '#ffcc00' }).setLngLat([longitude, latitude]).addTo(map.value)
}
whenever(isReady, async () => {
  await addStartMarker()
  updateMap()
}, { once: true })
watch(target, updateMap)

function moveMapToUserGeolocation() {
  if (!map.value) {
    return
  }
  const { latitude: lat, longitude: lon } = position.value.coords
  map.value.easeTo({ center: { lat, lon }, zoom: INITIAL_ZOOM.value })
}

const DEFAULT_RADIUS = 400
function getRadiusFromBbox(bbox: BBox | null) {
  if (!bbox) {
    return DEFAULT_RADIUS
  }
  const center = [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2]
  const radius = distance(
    point(center),
    point([center[0], bbox[3]]),
    { units: 'meters' },
  )
  return Math.round(radius)
}
const radiusMeters = ref<number>(getRadiusFromBbox(userStore.settings.dailyRouteStartGeometry?.properties.radiusBbox ?? null))
const RADIUS_SOURCE_KEY = 'radius-source'
const RADIUS_LAYER_KEY = 'radius-layer'
const RADIUS_FILL_LAYER_KEY = 'radius-fill-layer'
const RADIUS_COLOR = '#ffcc00'
const RADIUS_DEFAULT_SETTINGS = {
  steps: 128,
  units: 'meters',
} as const
let startMarkerMoveSubscription: Subscription | null = null
async function moveZoomToRadiusBounds(attempt = 0) {
  if (!map.value || attempt > 3) {
    return
  }
  attempt++
  const mapBounds = map.value.getBounds()
  const radiusSource = map.value.getSource<GeoJSONSource>(RADIUS_SOURCE_KEY)
  if (!radiusSource) {
    return
  }
  const radiusBounds = await radiusSource.getBounds()
  const isContainsEveryBound = radiusBounds.toArray().every(bound => mapBounds.contains(bound))
  if (!isContainsEveryBound) {
    map.value.zoomOut({ animate: false })
    await moveZoomToRadiusBounds(attempt)
  }
}
async function updateMap() {
  if (!map.value) {
    return
  }
  if (startMarkerMoveSubscription) {
    startMarkerMoveSubscription.unsubscribe()
  }
  if (target.value === 'start') {
    startMarkerMoveSubscription = map.value.on('move', () => {
      if (!map.value || !startMarker) {
        return
      }
      startMarker.setLngLat(map.value.getCenter())
    })
  }
  else if (target.value === 'radius') {
    if (userStore.dailyRouteStartPosition) {
      const [longitude, latitude] = userStore.dailyRouteStartPosition
      startMarker?.setLngLat([longitude, latitude])
    }
    addRadiusSelector()
    await moveZoomToRadiusBounds()
    map.value.on('zoom', () => {
      if (!userStore.dailyRouteStartPosition) {
        return
      }
      const newRadius = Math.max(DEFAULT_RADIUS, Math.round(DEFAULT_RADIUS * 2 ** (INITIAL_ZOOM.value - map.value!.getZoom())))
      const newCircle = circle(userStore.dailyRouteStartPosition, newRadius, {
        ...RADIUS_DEFAULT_SETTINGS,
      })
      newCircle.bbox = bbox(newCircle)
      const radiusSource = map.value!.getSource<GeoJSONSource>(RADIUS_SOURCE_KEY)
      if (radiusSource) {
        radiusSource.setData(newCircle)
      }
      radiusMeters.value = newRadius
    })
  }
}
function addRadiusSelector() {
  if (!map.value) {
    return
  }
  if (!userStore.dailyRouteStartPosition) {
    console.error('Start position is not set')
    return
  }
  const radiusLayer = map.value.getLayer(RADIUS_LAYER_KEY)
  if (radiusLayer) {
    map.value.removeLayer(RADIUS_LAYER_KEY)
  }
  const radiusSource = map.value.getSource(RADIUS_SOURCE_KEY)
  if (radiusSource) {
    map.value.removeSource(RADIUS_SOURCE_KEY)
  }
  const polygonCircle = circle(
    userStore.dailyRouteStartPosition,
    radiusMeters.value,
    { ...RADIUS_DEFAULT_SETTINGS },
  )
  map.value.addSource(RADIUS_SOURCE_KEY, {
    type: 'geojson',
    data: polygonCircle,
  })
  map.value.addLayer({
    id: RADIUS_FILL_LAYER_KEY,
    type: 'fill',
    source: RADIUS_SOURCE_KEY,
    paint: {
      'fill-color': RADIUS_COLOR,
      'fill-opacity': 0.1,
    },
  })
  map.value.addLayer({
    id: RADIUS_LAYER_KEY,
    source: RADIUS_SOURCE_KEY,
    type: 'line',
    paint: {
      'line-color': RADIUS_COLOR,
      'line-width': 2,
    },
  })
}

async function saveTarget() {
  if (!map.value || !startMarker) {
    throw new Error('Map not initialized')
  }
  const coordinates = startMarker.getLngLat().toArray()
  let bboxRadius = userStore.settings.dailyRouteStartGeometry?.properties.radiusBbox ?? null
  const radiusSource = await map.value.getSource<GeoJSONSource>(RADIUS_SOURCE_KEY)?.getData()
  if (radiusSource) {
    bboxRadius = bbox(radiusSource)
  }
  userStore.settings.dailyRouteStartGeometry = {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates,
    },
    properties: {
      radiusBbox: target.value === 'start' ? null : bboxRadius,
    },
  }
  if (localStorage.getItem(IS_ONBOARDING_FINISHED_KEY) !== 'true') {
    return
  }
  if (target.value === 'radius' || !!userStore.settings.dailyRouteStartGeometry?.properties.radiusBbox) {
    router.push('/')
  }
  else {
    router.push({ ...router.currentRoute.value, query: { target: 'radius' } })
  }
  toast.success(target.value === 'start' ? t('settings.startPoint.saved') : t('settings.radius.saved'))
}
</script>

<style>
.settings-edit-page {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  .setting-edit-page__map {
    position: relative;
    height: 60%;
    .map {
      height: 100%;
    }
    .map__top-container {
      position: absolute;
      top: 42px;
      z-index: 10;
      display: flex;
      justify-content: end;
      width: 100%;
      padding-inline: var(--content-padding-inline);
    }
  }
  .setting-edit-page__data {
    display: grid;
    gap: 0.5rem;
    padding-inline: var(--content-padding-inline);
    .setting-edit-page__data-radius {
      font-size: 1.5rem;
      text-align: center;
      text-transform: lowercase;
    }
  }
}
</style>
