import { StorageSerializers, useEventListener, useLocalStorage } from '@vueuse/core'
import { computed, onUnmounted, ref } from 'vue'
import { getAppLocale } from '@/i18n'
import 'temporal-polyfill/global'

interface Stopwatch {
  startTime: ReturnType<Temporal.Instant['toString']> | null
  duration: ReturnType<Temporal.Duration['toString']>
}
const FORMATTER_OPTIONS = {
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
  timeZone: 'UTC',
} as const as Intl.DateTimeFormatOptions
export function useStopwatch() {
  let frameRequestId: ReturnType<typeof requestAnimationFrame> | null = null
  function clearFrameRequest() {
    if (!frameRequestId) {
      return
    }
    cancelAnimationFrame(frameRequestId)
    frameRequestId = null
  }

  const duration = ref(Temporal.Duration.from({ seconds: 0 }))
  const stopwatch = useLocalStorage<Stopwatch>('stopwatch', {
    startTime: null,
    duration: duration.value.toString(),
  }, { serializer: StorageSerializers.object })
  function tick() {
    if (!stopwatch.value.startTime) {
      return
    }
    frameRequestId = requestAnimationFrame(tick)
    duration.value = Temporal.Now.instant().since(stopwatch.value.startTime)
  }
  function start() {
    if (frameRequestId) {
      return
    }
    if (!stopwatch.value.startTime) {
      stopwatch.value.startTime = Temporal.Now.instant().toString()
    }
    else {
      stopwatch.value.startTime = Temporal.Now.instant().subtract(stopwatch.value.duration).toString()
    }
    frameRequestId = requestAnimationFrame(tick)
  }
  function stop() {
    stopwatch.value.duration = duration.value.toString()
    clearFrameRequest()
  }
  function reset() {
    stopwatch.value.startTime = null
    stopwatch.value.duration = Temporal.Duration.from({ seconds: 0 }).toString()
    clearFrameRequest()
  }

  const dateTimeFormatter = new Intl.DateTimeFormat(getAppLocale(), FORMATTER_OPTIONS)
  const dateTimeWithHoursFormatter = new Intl.DateTimeFormat(getAppLocale(), {
    ...FORMATTER_OPTIONS,
    hour: '2-digit',
  })
  const value = computed(() => {
    const ms = duration.value.total({ unit: 'milliseconds' })
    return duration.value.hours > 0 ? dateTimeWithHoursFormatter.format(ms) : dateTimeFormatter.format(ms)
  })

  onUnmounted(clearFrameRequest)
  useEventListener('beforeunload', () => {
    if (frameRequestId) {
      stopwatch.value.duration = duration.value.toString()
    }
  })

  return {
    start,
    stop,
    reset,
    value,
  }
}
