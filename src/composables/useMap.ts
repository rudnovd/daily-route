import type { MapOptions } from '@maptiler/sdk'
import type { useTemplateRef } from 'vue'
import { geolocation, Map, MapStyle } from '@maptiler/sdk'
import { onMounted, onUnmounted, ref, shallowRef } from 'vue'
import { useUserStore } from '@/stores/user'
import { useGeolocation } from './useGeolocation'

export function useMap(
  container: ReturnType<typeof useTemplateRef<HTMLElement>>,
  mapOptions?: Omit<MapOptions, 'container'>,
) {
  const userStore = useUserStore()
  const map = shallowRef<Map | null>(null)
  const isReady = ref<boolean>(false)
  const darkTheme = window.matchMedia('(prefers-color-scheme: dark)')
  async function setup() {
    if (!container.value) {
      return console.error('Container not found')
    }
    map.value = new Map({
      container: container.value,
      language: userStore.settings.locale,
      style: darkTheme.matches ? MapStyle.STREETS_V4.DARK : MapStyle.STREETS_V4.DEFAULT,
      geolocateControl: false,
      navigationControl: false,
      logoPosition: 'top-right',
      zoom: 16,
      minZoom: 10,
      maxZoom: 18,
      keyboard: false,
      dragRotate: false,
      ...mapOptions,
    })
    const loadedMap = await map.value.onLoadAsync()
    try {
      const { coords: { latitude, longitude } } = await useGeolocation().getPosition()
      loadedMap.setCenter([longitude, latitude])
    }
    catch (error) {
      console.error(error)
      const { longitude, latitude } = await geolocation.info()
      if (longitude && latitude) {
        loadedMap.setCenter([longitude, latitude])
      }
    }
    finally {
      isReady.value = true
    }
  }
  function destroy() {
    isReady.value = false
    map.value?.remove()
    map.value = null
  }
  onMounted(setup)
  onUnmounted(destroy)

  return {
    setup,
    map,
    isReady,
  }
}
