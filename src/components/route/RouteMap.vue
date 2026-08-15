<template>
  <div class="route-map">
    <header v-if="isReady" class="route-map__top-container">
      <button
        v-if="routeStore.status === 'started' || routeStore.status === 'paused'"
        class="icon-button icon-button--medium button-primary"
        @click="togglePathVisibility"
      >
        <component :is="userStore.settings.isRoutePathVisible ? MdiEyeIcon : MdiEyeOffIcon" />
      </button>
    </header>
    <div ref="mapElement" class="route-map__element" />
    <div v-if="isReady" class="route-map__bottom-container">
      <div class="bottom-container__left-side">
        <div v-if="routeStore.daysStreak">
          <MdiFireIcon />
          <span class="tabular-num">{{ routeStore.daysStreak }}</span>
        </div>
      </div>
      <div class="bottom-container__right-side">
        <div>
          <button v-wave class="icon-button icon-button--medium button-primary" @click="map?.zoomIn()">
            <MdiPlusIcon />
          </button>
          <button v-wave class="icon-button icon-button--medium button-primary" @click="map?.zoomOut()">
            <MdiMinusIcon />
          </button>
        </div>
        <button v-wave class="icon-button icon-button--medium button-primary geolocation-button" @click="moveMapToUserGeolocation">
          <MdiNavigation />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GeoJSONSource } from '@maptiler/sdk'
import type { Position } from 'geojson'
import { Marker } from '@maptiler/sdk'
import { distance, nearestPointOnLine, point } from '@turf/turf'
import { whenever } from '@vueuse/core'
import { onActivated, onDeactivated, useTemplateRef, watch } from 'vue'
import MdiEyeIcon from '~icons/mdi/eye'
import MdiEyeOffIcon from '~icons/mdi/eye-off'
import MdiFireIcon from '~icons/mdi/fire'
import MdiMinusIcon from '~icons/mdi/minus'
import MdiNavigation from '~icons/mdi/navigation'
import MdiPlusIcon from '~icons/mdi/plus'
import { useGeolocation } from '@/composables/useGeolocation'
import { useMap } from '@/composables/useMap'
import { useRouteStore } from '@/stores/route'
import { useUserStore } from '@/stores/user'

const { position, watch: watchGeolocation, clear: clearWatcher, getPosition } = useGeolocation()
onActivated(watchGeolocation)
onDeactivated(clearWatcher)

const mapRef = useTemplateRef('mapElement')
const { map, isReady } = useMap(mapRef)
async function moveMapToUserGeolocation() {
  if (!map.value) {
    return
  }
  const { coords: { longitude, latitude } } = await getPosition()
  map.value.setCenter([longitude, latitude])
}
const userStore = useUserStore()
const routeStore = useRouteStore()
whenever(isReady, async () => {
  const { coords: { longitude, latitude } } = await getPosition()
  initGeolocationPoint([longitude, latitude])
  if (userStore.dailyRouteStartPosition) {
    initStartMarker()
  }
  if (routeStore.path) {
    initFinishMarker()
    initRouteLine()
  }
}, { once: true })
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
watch(userStore.settings, (settings) => {
  if (!settings.dailyRouteStartGeometry?.geometry) {
    return startMarker?.remove()
  }
  if (!startMarker) {
    return initStartMarker()
  }
  const [longitude, latitude] = settings.dailyRouteStartGeometry.geometry.coordinates
  const newMarkerDistance = distance([longitude, latitude], startMarker.getLngLat().toArray())
  if (newMarkerDistance === 0) {
    return
  }
  startMarker.setLngLat([longitude, latitude])
})
function initFinishMarker() {
  if (!map.value || !routeStore.finishPosition) {
    return
  }
  const [lng, lat] = routeStore.finishPosition
  finishMarker = new Marker({ color: '#22c55e' }).setLngLat([lng, lat]).addTo(map.value)
}

const GEOLOCATION_POINT_SOURCE_KEY = 'geolocation-point-source'
const GEOLOCATION_POINT_LAYER_KEY = 'geolocation-point-layer'
function initGeolocationPoint(position: Position) {
  if (!map.value) {
    return
  }
  const [longitude, latitude] = position
  map.value.addSource(GEOLOCATION_POINT_SOURCE_KEY, {
    type: 'geojson',
    data: {
      type: 'Point',
      coordinates: [longitude, latitude],
    },
  })
  map.value.addLayer({
    id: GEOLOCATION_POINT_LAYER_KEY,
    type: 'circle',
    source: GEOLOCATION_POINT_SOURCE_KEY,
    paint: {
      'circle-radius': 8,
      'circle-color': '#ffcc00',
      'circle-opacity': 0.8,
    },
  })
}
function updateGeolocationPoint(position: Position) {
  if (!map.value) {
    return
  }
  const geolocationPointSource = map.value.getSource<GeoJSONSource>(
    GEOLOCATION_POINT_SOURCE_KEY,
  )
  if (geolocationPointSource) {
    geolocationPointSource.setData({
      type: 'Point',
      coordinates: position,
    })
  }
}

watch(position, async ({ coords: { longitude, latitude } }) => {
  if (!isReady.value) {
    return
  }
  updateGeolocationPoint([longitude, latitude])
  if (routeStore.status !== 'started' || !routeStore.path?.features.length) {
    return
  }
  const path = routeStore.path.features.at(0)?.geometry ?? null
  if (!path) {
    return
  }
  const currentPositionPoint = point([longitude, latitude])
  const { properties: { pointDistance } } = nearestPointOnLine(path, currentPositionPoint, { units: 'meters' })
  if (pointDistance > 100) {
    await routeStore.recalculateCurrentRoutePath()
    updateRouteLine()
  }
}, { deep: true })

async function togglePathVisibility() {
  userStore.settings.isRoutePathVisible = !userStore.settings.isRoutePathVisible
  updateRouteLine()
}

const ROUTE_LINE_SOURCE_KEY = 'route-line-source'
const ROUTE_LINE_LAYER_KEY = 'route-line-layer'
function initRouteLine() {
  if (!routeStore.path) {
    return
  }
  map.value?.addSource(ROUTE_LINE_SOURCE_KEY, {
    type: 'geojson',
    data: routeStore.path,
  })
  map.value?.addLayer({
    id: ROUTE_LINE_LAYER_KEY,
    type: 'line',
    source: ROUTE_LINE_SOURCE_KEY,
    layout: {
      visibility: userStore.settings.isRoutePathVisible ? 'visible' : 'none',
    },
    paint: {
      'line-width': 3,
      'line-color': '#ffcc00',
    },
  })
}
function removeRouteLine() {
  if (!map.value) {
    return
  }
  const hasRouteLineLayer = !!map.value.getLayer(ROUTE_LINE_LAYER_KEY)
  if (hasRouteLineLayer) {
    map.value.removeLayer(ROUTE_LINE_LAYER_KEY)
  }
  const hasRouteLineSource = !!map.value.getSource<GeoJSONSource>(
    ROUTE_LINE_SOURCE_KEY,
  )
  if (hasRouteLineSource) {
    map.value.removeSource(ROUTE_LINE_SOURCE_KEY)
  }
}
function updateRouteLine() {
  if (!map.value || !routeStore.path) {
    return
  }
  const routePathSource = map.value?.getSource<GeoJSONSource>(
    ROUTE_LINE_SOURCE_KEY,
  )
  if (routePathSource) {
    routePathSource.setData(routeStore.path)
  }
  const routePathLayer = map.value.getLayer(ROUTE_LINE_LAYER_KEY)
  if (routePathLayer) {
    map.value.setLayoutProperty(
      ROUTE_LINE_LAYER_KEY,
      'visibility',
      userStore.settings.isRoutePathVisible ? 'visible' : 'none',
    )
  }
}
watch(
  () => routeStore.status,
  (status, prevStatus) => {
    if (!map.value || !isReady.value) {
      return
    }
    if (prevStatus !== 'paused' && status === 'started') {
      initFinishMarker()
      if (finishMarker) {
        map.value.setCenter(finishMarker.getLngLat())
      }
      initRouteLine()
      map.value.setZoom(12)
    }
    else if (!status) {
      finishMarker?.remove()
      removeRouteLine()
    }
  },
)
defineExpose({ isReady })
</script>

<style>
@import url('@maptiler/sdk/dist/maptiler-sdk.css');
.route-map {
  position: relative;
  height: 100%;
  .route-map__element {
    height: 100%;
  }
  .route-map__top-container {
    position: absolute;
    top: 5%;
    z-index: 10;
    display: flex;
    width: 100%;
    padding-inline: var(--content-padding-inline);
    pointer-events: none;
    button {
      pointer-events: auto;
    }
  }
  .route-map__bottom-container {
    position: absolute;
    bottom: 5%;
    display: flex;
    align-items: center;
    align-items: end;
    justify-content: space-between;
    width: 100%;
    padding-inline: var(--content-padding-inline);
    color: var(--color-accent);
    pointer-events: none;
    .bottom-container__right-side,
    .bottom-container__left-side {
      display: flex;
      flex-direction: column;
    }
    .bottom-container__left-side {
      div {
        display: flex;
      }
      span {
        -webkit-text-stroke: 1px rgb(0 0 0 / 9.5%);
      }
    }
    .bottom-container__right-side {
      gap: 4rem;
      div {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
    }
    button {
      pointer-events: auto;
    }
  }
  .maplibregl-ctrl.maplibregl-ctrl-attrib,
  .maplibregl-ctrl-top-right {
    font-size: 0.5rem;
    background-color: transparent;
    opacity: 0.5;
    a {
      color: var(--color-text);
    }
  }
}
</style>
