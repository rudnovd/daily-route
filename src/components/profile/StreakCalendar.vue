<template>
  <ul class="streak-calendar">
    <li
      v-for="streakDate in streakCalendarDates"
      :key="streakDate.plainDate.toString()"
      class="streak-calendar__date"
      :class="composeStreakDateClass(streakDate)"
    >
      <span class="streak-calendar__day">{{ streakDate.plainDate.day }}</span>
      <span class="streak-calendar__month">{{ streakDate.formattedMonthString }}</span>
      <template v-if="streakDate.showStatus && streakDate.plainDate.until(now).days >= 0">
        <MdiCheckBoldIcon v-if="streakDate.isCompleted" class="streak-calendar__icon color-success" />
        <MdiCloseThickIcon v-else class="streak-calendar__icon color-error" />
      </template>
    </li>
  </ul>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import MdiCheckBoldIcon from '~icons/mdi/check-bold'
import MdiCloseThickIcon from '~icons/mdi/close-thick'
import { getAppLocale } from '@/i18n'
import { useRouteStore } from '@/stores/route'
import 'temporal-polyfill/global'

interface StreakCalendarDate {
  plainDate: Temporal.PlainDate
  isCompleted: boolean
  formattedMonthString: ReturnType<Intl.DateTimeFormat['format']>
  showStatus: boolean
}
const streakCalendarDates = ref<Array<StreakCalendarDate>>([])
function formatStreakDate(date: Temporal.PlainDate): StreakCalendarDate {
  return {
    plainDate: date,
    isCompleted: false,
    formattedMonthString: new Intl.DateTimeFormat(getAppLocale(), { month: 'long' }).format(date),
    showStatus: true,
  }
}
const DISPLAYED_DAYS = 4
const now = Temporal.PlainDate.from(Temporal.Now.plainDateISO())
const substractedDate = now.subtract(Temporal.Duration.from({ days: DISPLAYED_DAYS }))
const routeStore = useRouteStore()
onMounted(() => {
  for (let i = 2; i <= DISPLAYED_DAYS + 1; i++) {
    const date = substractedDate.add(Temporal.Duration.from({ days: i }))
    streakCalendarDates.value.push(formatStreakDate(date))
  }
  for (const dailyRoute of routeStore.routes) {
    const plainCreatedAt = Temporal.PlainDate.from(dailyRoute.created_at)
    const isCurrentDay = now.until(plainCreatedAt).days === 0
    if (isCurrentDay) {
      const streakDate = streakCalendarDates.value.find(streakDay => streakDay.plainDate.day === plainCreatedAt.day)
      if (streakDate) {
        if (dailyRoute.status === 'finished') {
          streakDate.isCompleted = true
        }
        else if (dailyRoute.status === 'canceled') {
          streakDate.isCompleted = false
        }
        else {
          streakDate.showStatus = false
        }
      }
      continue
    }
    if (dailyRoute.status === 'finished' && dailyRoute.finished_at) {
      const plainDate = Temporal.PlainDate.from(dailyRoute.finished_at)
      const streakDate = streakCalendarDates.value.find(streakDay => streakDay.plainDate.day === plainDate.day)
      if (streakDate) {
        streakDate.isCompleted = true
      }
    }
  }
})
onUnmounted(() => {
  streakCalendarDates.value = []
})
function composeStreakDateClass(streakDate: StreakCalendarDate) {
  const key = 'streak-calendar__date'
  if (streakDate.plainDate.day === now.day) {
    return `${key}--current`
  }
  else if (now.until(streakDate.plainDate).days > 0) {
    return `${key}--future`
  }
  else if (!streakDate.isCompleted) {
    return `${key}--not-completed`
  }
}
</script>

<style>
.streak-calendar {
  display: grid;
  grid-template-rows: 64px;
  grid-template-columns: repeat(4, 1fr);
  justify-items: center;
  width: 100%;
  border: 1px solid var(--color-text);
  .streak-calendar__date {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding-block: 8px;
    border-right: 1px solid var(--color-text);
    &.streak-calendar__date--current {
      color: oklch(21.01% 0.0318 264.66deg);
      background-color: var(--color-accent);
    }
    .streak-calendar__month {
      font-size: 0.8rem;
    }
    &.streak-calendar__date--not-completed {
      .streak-calendar__day,
      .streak-calendar__month {
        opacity: 0.2;
      }
    }
    .streak-calendar__icon {
      position: absolute;
      top: 0;
      right: 2px;
      width: 1em;
      height: 1em;
    }
  }
}
</style>
