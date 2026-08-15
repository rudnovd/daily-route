import type { Config, Driver } from 'driver.js'
import { createSharedComposable } from '@vueuse/core'
import { driver } from 'driver.js'
import { customRef, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { IS_ONBOARDING_FINISHED_KEY, ONBOARDING_STEP_KEY } from '@/constants/onboarding'
import { useRouteStore } from '@/stores/route'
import { useUserStore } from '@/stores/user'
import 'driver.js/dist/driver.css'
import '@/assets/styles/onboarding.css'

export const useOnboarding = createSharedComposable(() => {
  const { t } = useI18n()
  const router = useRouter()
  const userStore = useUserStore()
  const routeStore = useRouteStore()
  const onboardingStep = customRef<number | null, number>((track, trigger) => {
    return {
      get() {
        track()
        const step = localStorage.getItem(ONBOARDING_STEP_KEY)
        return step ? Number(step) : null
      },
      set(newValue) {
        trigger()
        localStorage.setItem(ONBOARDING_STEP_KEY, String(newValue))
      },
    }
  })
  function getConfig(): Config {
    return {
      nextBtnText: t('onboarding.buttons.next'),
      prevBtnText: t('onboarding.buttons.prev'),
      doneBtnText: t('onboarding.buttons.finish'),
      popoverClass: 'onboarding-popover',
      overlayClickBehavior: undefined,
      allowClose: true,
      waitForElement: 10_000,
      stagePadding: 0,
      steps: [
        {
          element: '[data-onboarding-element="map-container"]',
          popover: {
            title: t('onboarding.steps[0].title'),
            description: t('onboarding.steps[0].description'),
            side: 'bottom',
            align: 'center',
          },
          data: {
            path: '/settings/edit?target=start',
          },
        },
        {
          element: '[data-onboarding-element="save-target-button"]',
          popover: {
            description: t('onboarding.steps[1].description'),
            side: 'bottom',
            align: 'center',
            disableButtons: ['next'],
          },
          advanceOnClick: true,
          data: {
            path: '/settings/edit?target=start',
          },
        },
        {
          element: '[data-onboarding-element="map-container"]',
          popover: {
            title: t('onboarding.steps[2].title'),
            description: t('onboarding.steps[2].description'),
            side: 'bottom',
            align: 'center',
          },
          data: {
            path: '/settings/edit?target=radius',
          },
        },
        {
          element: '[data-onboarding-element="save-target-button"]',
          popover: {
            description: t('onboarding.steps[3].description'),
            side: 'bottom',
            align: 'center',
            disableButtons: ['next'],
          },
          advanceOnClick: true,
          data: {
            path: '/settings/edit?target=radius',
          },
        },
        {
          element: routeStore.isDailyRouteCompleted ? '.index-page' : '[data-onboarding-element="start-daily-route-button"]',
          popover: {
            description: t('onboarding.steps[4].description'),
            side: 'bottom',
            align: 'center',
          },
          disableActiveInteraction: true,
          data: {
            path: '/',
          },
        },
      ],
      onPrevClick: back,
      onNextClick: next,
      onDestroyed: () => {
        localStorage.removeItem(ONBOARDING_STEP_KEY)
        localStorage.setItem(IS_ONBOARDING_FINISHED_KEY, 'true')
        if (!userStore.isAuthenticated) {
          router.push('/profile/signin')
        }
      },
    }
  }
  const instance: Driver = driver(getConfig())
  async function back() {
    if (onboardingStep.value === null) {
      onboardingStep.value = 1
    }
    onboardingStep.value -= 1
    const path: string | null = instance.getPreviousStep()?.data?.path ?? null
    if (path) {
      await router.replace(path)
      await nextTick()
    }
    instance.movePrevious()
  }
  async function next() {
    if (onboardingStep.value === null) {
      onboardingStep.value = 0
    }
    onboardingStep.value += 1
    const path: string | null = instance.getNextStep()?.data?.path ?? null
    if (path) {
      await router.replace(path)
      await nextTick()
    }
    instance.moveNext()
  }
  async function start() {
    instance.setConfig(getConfig())
    localStorage.setItem(IS_ONBOARDING_FINISHED_KEY, 'false')
    if (!onboardingStep.value) {
      onboardingStep.value = 0
    }
    const path: string | null = instance.getConfig().steps?.at(onboardingStep.value)?.data?.path ?? null
    if (path) {
      await router.replace(path)
      await nextTick()
    }
    instance.drive(onboardingStep.value)
    return instance
  }
  return {
    onboardingStep,
    start,
  }
})
