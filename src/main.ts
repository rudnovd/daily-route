import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import { IS_ONBOARDING_FINISHED_KEY, ONBOARDING_STEP_KEY } from './constants/onboarding'
import { getAppLocale, i18n, setLocale } from './i18n'
import { router } from './router'
import { useUserStore } from './stores/user'
import { supabase } from './supabase'

setLocale(getAppLocale()).then(async () => {
  const app = createApp(App)
  const pinia = createPinia()
  app.use(pinia)
  const userStore = useUserStore()
  const { data: { session } } = await supabase.auth.getSession()
  if (session) {
    userStore.user = session.user
  }
  app.use(router)
  const isOnboardingFinished = localStorage.getItem(IS_ONBOARDING_FINISHED_KEY) === 'true'
  if (!isOnboardingFinished) {
    localStorage.setItem(IS_ONBOARDING_FINISHED_KEY, 'false')
  }
  const hasStartedOnboarding = localStorage.getItem(ONBOARDING_STEP_KEY) !== null
  if (!isOnboardingFinished && !hasStartedOnboarding) {
    router.push('/onboarding')
  }
  app.use(i18n).mount('#app')
})
