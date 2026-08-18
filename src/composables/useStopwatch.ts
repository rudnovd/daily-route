import { createSharedComposable, useLocalStorage } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import 'temporal-polyfill/global'

type ms = number
interface Stopwatch {
  duration: ms
  isStarted: boolean
}
export const useStopwatch = createSharedComposable(() => {
  const stopwatch = useLocalStorage<Stopwatch>('stopwatch', {
    duration: 0,
    isStarted: false,
  })
  let timestamp: ReturnType<Performance['now']> = performance.now()
  const duration = ref<Stopwatch['duration']>(stopwatch.value.duration)

  let intervalID: ReturnType<typeof setInterval> | null = null
  function clearIntervalRequest() {
    if (intervalID === null) {
      return
    }
    clearInterval(intervalID)
    intervalID = null
  }
  function updateDuration() {
    const currentTimestamp = performance.now()
    duration.value += currentTimestamp - timestamp
    timestamp = currentTimestamp
  }
  function start() {
    if (intervalID) {
      return
    }
    stopwatch.value.isStarted = true
    timestamp = performance.now()
    updateDuration()
    intervalID = setInterval(updateDuration, 100)
  }
  function stop() {
    if (!stopwatch.value.isStarted) {
      return
    }
    clearIntervalRequest()
    updateDuration()
    stopwatch.value.duration = duration.value
    stopwatch.value.isStarted = false
  }
  function reset() {
    clearIntervalRequest()
    stopwatch.value.isStarted = false
    stopwatch.value.duration = 0
    duration.value = 0
  }
  const value = computed(() => {
    const totalSeconds = Math.floor(duration.value / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    const hh = String(hours).padStart(2, '0')
    const mm = String(minutes).padStart(2, '0')
    const ss = String(seconds).padStart(2, '0')
    return hours > 0 ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`
  })
  watch(value, () => {
    stopwatch.value.duration = duration.value
  })
  if (stopwatch.value.isStarted) {
    start()
  }

  return {
    start,
    stop,
    reset,
    value,
  }
})
