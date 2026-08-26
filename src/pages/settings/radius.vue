<template>
  <section class="settings-radius-page" data-onboarding-element="radius-page">
    <div class="settings-radius-page__map">
      <div ref="mapElement" class="settings-radius-page__map-element" />
      <div v-if="isReady" class="settings-radius-page__map-bottom-container">
        <div class="bottom-container__right-side">
          <div>
            <button v-wave class="icon-button icon-button--medium button-primary" @click="map?.zoomIn()">
              <IconPlus />
            </button>
            <button v-wave class="icon-button icon-button--medium button-primary" @click="map?.zoomOut()">
              <IconMinus />
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="isReady" class="settings-radius-page__data">
      <span class="radius-text">
        {{ isFreeSelection ? $t('settings.radius.zoomToSelectRadius') : $t('settings.radius.selectRadius') }}
      </span>
      <ul class="radius-cards-list">
        <li v-for="{ icon, value } in RADIUS_VALUES" :key="value">
          <button
            v-wave
            class="radius-card"
            :class="{ 'radius-card--active': !isFreeSelection && radiusMeters === value }"
            @click="selectRadius(value)"
          >
            <component :is="icon" class="radius-card__icon" />
            <slot name="radius">
              <span v-if="value">{{ value / 1000 }}{{ $t('units.kilometersShort') }}</span>
            </slot>
          </button>
        </li>
        <li>
          <button
            v-wave
            class="radius-card"
            :class="{ 'radius-card--active': isFreeSelection }"
            @click="isFreeSelection = true"
          >
            <IconRadiusOutline class="radius-card__icon" />
            {{ isFreeSelection ? `${radiusMeters}${$t('units.metersShort')}` : $t('settings.radius.buttons.selectRadius') }}
          </button>
        </li>
      </ul>
      <button v-wave class="button-success" data-onboarding-element="save-button" @click="save">
        {{ $t('common.save') }}
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
import { ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import IconMinus from '~icons/mdi/minus'
import IconPlus from '~icons/mdi/plus'
import IconRadiusOutline from '~icons/mdi/radius-outline'
import IconSizeL from '~icons/mdi/size-l'
import IconSizeM from '~icons/mdi/size-m'
import IconSizeS from '~icons/mdi/size-s'
import IconSizeXL from '~icons/mdi/size-xl'
import { useMap } from '@/composables/useMap'
import { IS_ONBOARDING_FINISHED_KEY } from '@/constants/onboarding'
import { useUserStore } from '@/stores/user'

definePage({
  meta: { title: 'settings.maxDistance.shortTitle', displayTitle: true },
  beforeEnter() {
    if (!useUserStore().dailyRouteStartPosition) {
      toast.error('Start point not set')
      return '/settings/start'
    }
  },
})

const router = useRouter()
const mapRef = useTemplateRef('mapElement')
const INITIAL_ZOOM = 14
const { map, isReady } = useMap(mapRef, {
  zoom: INITIAL_ZOOM,
  minZoom: 9,
  maxZoom: 14,
})
let startMarker: Marker | null = null
const userStore = useUserStore()
async function addStartMarker() {
  if (!map.value) {
    return
  }
  if (!userStore.dailyRouteStartPosition) {
    throw new Error('Start position not set')
  }
  if (startMarker) {
    startMarker.remove()
  }
  const [longitude, latitude] = userStore.dailyRouteStartPosition
  startMarker = new Marker({ color: '#ffcc00' }).setLngLat([longitude, latitude]).addTo(map.value)
}

const INITIAL_RADIUS = 1000
const RADIUS_SOURCE_KEY = 'radius-source'
const RADIUS_LAYER_KEY = 'radius-layer'
const RADIUS_FILL_LAYER_KEY = 'radius-fill-layer'
const RADIUS_COLOR = '#ffcc00'
const RADIUS_DEFAULT_SETTINGS = {
  steps: 128,
  units: 'meters',
} as const
const RADIUS_VALUES = [
  { icon: IconSizeS, value: 1000 },
  { icon: IconSizeM, value: 3000 },
  { icon: IconSizeL, value: 5000 },
  { icon: IconSizeXL, value: 10000 },
] as const
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
function getRadiusMetersFromBbox(bbox: BBox | null): number {
  if (!bbox) {
    return INITIAL_RADIUS
  }
  const center = [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2]
  const radius = distance(point(center), point([center[0], bbox[3]]), { units: 'meters' })
  return Math.round(radius)
}
const radiusMeters = ref<number>(getRadiusMetersFromBbox(userStore.settings.dailyRouteStartGeometry?.properties.radiusBbox ?? null))
const isFreeSelection = ref<boolean>(!RADIUS_VALUES.some(({ value }) => value === radiusMeters.value))
let radiusMoveSubscription: Subscription | null = null
function updateRadiusLayer(newRadius: number) {
  if (!map.value) {
    return
  }
  if (!userStore.dailyRouteStartPosition) {
    throw new Error('Daily route start position is not set')
  }
  const newCircle = circle(userStore.dailyRouteStartPosition, newRadius, { ...RADIUS_DEFAULT_SETTINGS })
  newCircle.bbox = bbox(newCircle)
  const radiusSource = map.value.getSource<GeoJSONSource>(RADIUS_SOURCE_KEY)
  if (radiusSource) {
    radiusSource.setData(newCircle)
  }
}
const DEFAULT_RADIUS = 400
async function addZoomEvent() {
  if (!map.value) {
    return
  }
  radiusMoveSubscription = map.value.on('zoom', () => {
    const newRadius = Math.max(DEFAULT_RADIUS, Math.round(DEFAULT_RADIUS * 2 ** (INITIAL_ZOOM - map.value!.getZoom())))
    updateRadiusLayer(newRadius)
    radiusMeters.value = newRadius
  })
}
function removeZoomEvent() {
  if (radiusMoveSubscription) {
    radiusMoveSubscription.unsubscribe()
  }
}
watch(isFreeSelection, (isActive) => {
  if (isActive) {
    if (startMarker) {
      map.value?.setCenter(startMarker.getLngLat())
    }
    map.value?.setZoom(INITIAL_ZOOM)
    radiusMeters.value = INITIAL_RADIUS
    addZoomEvent()
    map.value?.fire('zoom')
  }
  else {
    removeZoomEvent()
  }
})

function addRadiusLayers() {
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

whenever(isReady, async () => {
  addStartMarker()
  addRadiusLayers()
  moveZoomToRadiusBounds()
})
const { t } = useI18n()
async function save() {
  if (!map.value) {
    throw new Error('Map not initialized')
  }
  if (!userStore.dailyRouteStartPosition) {
    throw new Error('Start position not set')
  }
  let radiusBbox = userStore.settings.dailyRouteStartGeometry?.properties.radiusBbox ?? null
  const radiusSource = await map.value.getSource<GeoJSONSource>(RADIUS_SOURCE_KEY)?.getData()
  if (radiusSource) {
    radiusBbox = bbox(radiusSource)
  }
  userStore.settings.dailyRouteStartGeometry = {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: userStore.dailyRouteStartPosition,
    },
    properties: {
      radiusBbox,
    },
  }
  if (localStorage.getItem(IS_ONBOARDING_FINISHED_KEY) !== 'true') {
    return
  }
  router.push('/')
  toast.success(t('settings.radius.saved'))
}

function selectRadius(radius: number) {
  if (startMarker) {
    map.value?.setCenter(startMarker.getLngLat())
  }
  isFreeSelection.value = false
  radiusMeters.value = radius
  updateRadiusLayer(radius)
  map.value?.setZoom(INITIAL_ZOOM)
  moveZoomToRadiusBounds()
}
</script>

<style>
.settings-radius-page {
  display: grid;
  grid-template-rows: 1fr 1fr;
  gap: 0.5rem;
  .settings-radius-page__map {
    position: relative;
    .settings-radius-page__map-element {
      height: 100%;
    }
    .settings-radius-page__map-bottom-container {
      position: absolute;
      bottom: 24px;
      display: flex;
      align-items: end;
      justify-content: end;
      width: 100%;
      padding-inline: var(--content-padding-inline);
      color: var(--color-accent);
      pointer-events: none;
      .bottom-container__right-side div {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
      button {
        pointer-events: auto;
      }
    }
  }
  .settings-radius-page__data {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding-inline: var(--content-padding-inline);
    .radius-text {
      height: calc(1.25rem * 3 * 1.2);
    }
    .radius-cards-list {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      grid-auto-rows: max-content;
      gap: 0.5rem;
      .radius-card {
        display: flex;
        flex-direction: column;
        width: 100%;
        padding-inline: 0.125rem;
        background-color: var(--color-surface-background-secondary);
        border-color: var(--color-border);
        border-style: solid;
        border-width: 1px;
        border-radius: 8px;
        transition: border-color 0.5s;
        &.radius-card--active {
          border-color: var(--color-accent);
        }
        .radius-card__icon {
          font-size: 2rem;
          color: var(--color-accent);
        }
      }
      li:last-child {
        grid-area: auto / span 4;
      }
    }
  }
}
</style>
