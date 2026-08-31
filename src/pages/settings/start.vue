<template>
  <section class="settings-start-page">
    <div class="settings-start-page__map">
      <div ref="mapElement" class="settings-start-page__map-element" data-onboarding-element="map-container" />
      <div v-if="isReady" class="settings-start-page__map-bottom-container">
        <div class="bottom-container__right-side">
          <div>
            <button v-wave class="icon-button icon-button--medium button-primary" @click="map?.zoomIn()">
              <IconPlus />
            </button>
            <button v-wave class="icon-button icon-button--medium button-primary" @click="map?.zoomOut()">
              <IconMinus />
            </button>
          </div>
          <button v-wave class="icon-button icon-button--medium button-primary" @click="moveMapToUserGeolocation">
            <IconNavigation />
          </button>
        </div>
      </div>
    </div>
    <div v-if="isReady" class="settings-start-page__data">
      {{ $t('settings.startPoint.dragMapToSelectStartPoint') }}
      <button v-wave class="button-success" data-onboarding-element="save-button" @click="save">
        {{ $t('common.save') }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { Subscription } from '@maptiler/sdk'
import type { BBox, Position } from 'geojson'
import { Marker } from '@maptiler/sdk'
import { whenever } from '@vueuse/core'
import { onUnmounted, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import IconMinus from '~icons/mdi/minus'
import IconNavigation from '~icons/mdi/navigation'
import IconPlus from '~icons/mdi/plus'
import { useGeolocation } from '@/composables/useGeolocation'
import { useMap } from '@/composables/useMap'
import { IS_ONBOARDING_FINISHED_KEY } from '@/constants/onboarding'
import { useUserStore } from '@/stores/user'

definePage({ meta: { title: 'settings.startPoint.title', displayTitle: true } })

const router = useRouter()

const mapRef = useTemplateRef('mapElement')
const INITIAL_ZOOM = 15
const { map, isReady } = useMap(mapRef, {
  zoom: INITIAL_ZOOM,
  minZoom: 8,
  maxZoom: 18,
})
const { position, getPosition } = useGeolocation()
const userStore = useUserStore()
let startMarker: Marker | null = null
let startMarkerMoveSubscription: Subscription | null = null
async function addStartMarker() {
  if (!map.value) {
    return
  }
  if (startMarker) {
    startMarker.remove()
  }
  const { coords: { longitude, latitude } } = await getPosition()
  startMarker = new Marker({ color: '#ffcc00' }).setLngLat([longitude, latitude]).addTo(map.value)
  if (startMarkerMoveSubscription) {
    startMarkerMoveSubscription.unsubscribe()
  }
  startMarkerMoveSubscription = map.value.on('move', () => {
    if (!map.value || !startMarker) {
      return
    }
    startMarker.setLngLat(map.value.getCenter())
  })
}
function removeStartMarker() {
  if (startMarkerMoveSubscription) {
    startMarkerMoveSubscription.unsubscribe()
  }
  if (startMarker) {
    startMarker.remove()
  }
}
whenever(isReady, addStartMarker)
onUnmounted(removeStartMarker)

function moveMapToUserGeolocation() {
  if (!map.value) {
    return
  }
  const { latitude: lat, longitude: lon } = position.value.coords
  map.value.easeTo({ center: { lat, lon }, zoom: INITIAL_ZOOM })
}
function moveBbox(bbox: BBox, newCenter: Position): BBox {
  const [west, south, east, north] = bbox
  const centerX = (west + east) / 2
  const centerY = (south + north) / 2
  const dx = newCenter[0] - centerX
  const dy = newCenter[1] - centerY
  return [west + dx, south + dy, east + dx, north + dy]
}
const { t } = useI18n()
async function save() {
  if (!map.value) {
    throw new Error('Map not initialized')
  }
  else if (!startMarker) {
    throw new Error('Start marker not set')
  }
  const coordinates = startMarker.getLngLat().toArray()
  let radiusBbox = userStore.settings.dailyRouteStartGeometry?.properties.radiusBbox ?? null
  if (radiusBbox) {
    radiusBbox = moveBbox(radiusBbox, coordinates)
  }
  userStore.settings.dailyRouteStartGeometry = {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates,
    },
    properties: {
      radiusBbox,
    },
  }
  if (localStorage.getItem(IS_ONBOARDING_FINISHED_KEY) !== 'true') {
    return
  }
  radiusBbox ? router.push('/') : router.push('/settings/radius')
  toast.success(t('settings.startPoint.saved'))
}
</script>

<style>
.settings-start-page {
  display: grid;
  grid-template-rows: 1fr 1fr;
  gap: 0.5rem;
  .settings-start-page__map {
    position: relative;
    .settings-start-page__map-element {
      height: 100%;
    }
    .settings-start-page__map-bottom-container {
      position: absolute;
      bottom: 24px;
      display: flex;
      align-items: end;
      justify-content: end;
      width: 100%;
      padding-inline: var(--content-padding-inline);
      color: var(--color-accent);
      pointer-events: none;
      .bottom-container__right-side {
        display: flex;
        flex-direction: column;
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
  }
  .settings-start-page__data {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding-inline: var(--content-padding-inline);
    overflow: auto;
    scrollbar-width: thin;
  }
}
</style>
