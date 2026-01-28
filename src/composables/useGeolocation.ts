import type { PositionOptions } from '@tauri-apps/plugin-geolocation'
import { geolocation } from '@maptiler/sdk'
import {
  checkPermissions,
  clearWatch,
  getCurrentPosition,
  requestPermissions,
  watchPosition,
} from '@tauri-apps/plugin-geolocation'
import { createSharedComposable } from '@vueuse/core'
import { ref } from 'vue'

interface Position {
  timestamp: GeolocationPosition['timestamp']
  coords: Omit<GeolocationPosition['coords'], 'toJSON'>
}
const DEFAULT_POSITION = {
  timestamp: 0,
  coords: {
    latitude: 0,
    longitude: 0,
    accuracy: 0,
    altitude: null,
    altitudeAccuracy: null,
    heading: null,
    speed: null,
  },
} as const as Position
const options = {
  enableHighAccuracy: true,
  timeout: 10_000,
  maximumAge: 20_000,
} as const as PositionOptions

export const useGeolocation = createSharedComposable(() => {
  const position = ref<Position>(structuredClone(DEFAULT_POSITION))

  async function hasPermission(): Promise<boolean> {
    if (import.meta.env.VITE_IS_TAURI) {
      try {
        const { location: permission } = await checkPermissions()
        if (permission === 'granted') {
          return true
        }
        else if (permission === 'prompt' || permission === 'prompt-with-rationale') {
          try {
            const { location: request } = await requestPermissions(['location'])
            return request === 'granted'
          }
          catch {
            return false
          }
        }
        else {
          return false
        }
      }
      catch {
        return false
      }
    }
    return 'geolocation' in navigator
  }

  async function getPosition(): Promise<Position> {
    const isPermissionGranted = await hasPermission()
    if (!isPermissionGranted) {
      return DEFAULT_POSITION
    }
    if (import.meta.env.VITE_IS_TAURI) {
      try {
        const currentPosition = await getCurrentPosition(options)
        position.value = currentPosition
        return currentPosition
      }
      catch {
        return position.value
      }
    }
    else {
      return new Promise<Position>(
        (resolve, reject) => navigator.geolocation.getCurrentPosition(
          (currentPosition) => {
            position.value = currentPosition
            resolve(position.value)
          },
          () => {
            geolocation.info()
              .then(({ latitude, longitude }) => {
                position.value = {
                  ...position.value,
                  coords: {
                    ...position.value.coords,
                    latitude: latitude ?? position.value.coords.latitude,
                    longitude: longitude ?? position.value.coords.longitude,
                  },
                  timestamp: Temporal.Now.instant().epochMilliseconds,
                }
                resolve(position.value)
              })
              .catch((error) => {
                reject(error)
              })
          },
          options,
        ),
      )
    }
  }

  let watcherId: ReturnType<Geolocation['watchPosition']> = 0
  async function watch(): Promise<ReturnType<Geolocation['watchPosition']>> {
    if (watcherId) {
      clear()
    }
    const isPermissionGranted = await hasPermission()
    if (!isPermissionGranted) {
      throw new Error('Permission not granted')
    }
    if (import.meta.env.VITE_IS_TAURI) {
      watchPosition(options, (location, error) => {
        if (error) {
          console.error(error)
        }
        if (!location) {
          position.value = DEFAULT_POSITION
        }
        else {
          position.value = location
        }
      })
        .then((id) => { watcherId = id })
        .catch((error) => { console.error(error) })
    }
    else {
      watcherId = navigator.geolocation.watchPosition(
        (geolocaitonPosition) => {
          position.value = geolocaitonPosition
        },
        (error) => { console.error(error) },
        options,
      )
    }
    return watcherId
  }

  async function clear(): Promise<boolean> {
    if (!watcherId) {
      return false
    }
    if (import.meta.env.VITE_IS_TAURI) {
      await clearWatch(watcherId)
    }
    else {
      navigator.geolocation.clearWatch(watcherId)
    }
    watcherId = 0
    return true
  }

  return {
    position,
    getPosition,
    watch,
    clear,
  }
})
