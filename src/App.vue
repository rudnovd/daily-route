<template>
  <NavigationHeader v-if="isTitleDisplayed" />
  <hr v-if="isTitleDisplayed">
  <RouterView v-slot="{ Component }">
    <main :class="{ 'hide-top-padding': router.currentRoute.value.meta.hideTopPadding }">
      <KeepAlive include="index">
        <component :is="Component" />
      </KeepAlive>
    </main>
  </RouterView>
  <Navbar v-if="routerIsReady && !router.currentRoute.value.meta.isNavbarHidden" />
  <NoConnectionBadge v-if="!userStore.isOnline" />
  <Toaster theme="system" position="top-center" :toast-options="{ class: 'notification' }" />
</template>

<script setup lang="ts">
import { config as maptilerConfig } from '@maptiler/sdk'
import { whenever } from '@vueuse/core'
import { computed, defineAsyncComponent, onBeforeMount, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { toast, Toaster } from 'vue-sonner'
import NoConnectionBadge from './components/NoConnectionBadge.vue'
import { useOnboarding } from './composables/useOnboarding'
import { IS_ONBOARDING_FINISHED_KEY } from './constants/onboarding'
import { useRouteStore } from './stores/route'
import { useUserStore } from './stores/user'
import { supabase } from './supabase'

maptilerConfig.apiKey = import.meta.env.VITE_MAPTILER_API_KEY
if (import.meta.env.VITE_IS_TAURI) {
  import('./assets/styles/tauri.css')
}
else {
  import('./assets/styles/web.css')
}
const NavigationHeader = defineAsyncComponent(() => import('./components/NavigationHeader.vue'))
const Navbar = defineAsyncComponent(() => import('./components/Navbar.vue'))

const router = useRouter()
const isTitleDisplayed = computed<boolean>(() => {
  return !!router.currentRoute.value.meta.title && !!router.currentRoute.value.meta.displayTitle
})
const userStore = useUserStore()
const routeStore = useRouteStore()
async function cancelExpiredRoute() {
  if (!routeStore.lastRoute?.started_at) {
    return
  }
  if (routeStore.lastRoute.status === 'started') {
    const startedAt = Temporal.PlainDate.from(routeStore.lastRoute.started_at)
    const now = Temporal.PlainDate.from(Temporal.Now.plainDateISO())
    if (now.since(startedAt).days > 0) {
      await routeStore.cancelRoute(routeStore.lastRoute.id)
    }
  }
}
const { t } = useI18n()
async function exchangeCodeForSession(urlString: string) {
  const code = new URL(urlString).searchParams.get('code')
  if (!code) {
    return
  }
  const { error } = await supabase.auth.exchangeCodeForSession(code)
  if (error) {
    toast.error(t('profile.signIn.notifications.failedToSignedIn'))
    console.error(error)
    return
  }
  toast.success(t('profile.signIn.notifications.successfullySignedIn'))
}
onBeforeMount(async () => {
  if (import.meta.env.VITE_IS_TAURI) {
    await exchangeCodeForSession(window.location.href)
    router.replace('/')
  }
  if (userStore.isAuthenticated) {
    routeStore.getRoutes().then(cancelExpiredRoute)
  }
})
if (import.meta.env.VITE_IS_TAURI) {
  let listenerRemover: (() => void) | null = null
  import('@tauri-apps/plugin-deep-link').then(async ({ onOpenUrl }) => {
    listenerRemover = await onOpenUrl(async (urls) => {
      if (!urls.length) {
        return
      }
      await exchangeCodeForSession(urls[0])
    })
  })
  onUnmounted(() => {
    if (listenerRemover) {
      listenerRemover()
    }
  })
}
const routerIsReady = ref<boolean>(false)
onMounted(async () => {
  const isOnboardingFinished = localStorage.getItem(IS_ONBOARDING_FINISHED_KEY) === 'true'
  if (!isOnboardingFinished) {
    const { onboardingStep, start } = useOnboarding()
    if (onboardingStep.value !== null) {
      start()
    }
  }
  await router.isReady()
  routerIsReady.value = true
  if (router.currentRoute.value.query.error_description) {
    toast.error(router.currentRoute.value.query.error_description.toString())
  }
})
supabase.auth.onAuthStateChange((_, session) => {
  userStore.user = session?.user ?? null
})
whenever(() => userStore.isAuthenticated, () => {
  routeStore.getRoutes().then(cancelExpiredRoute)
})
</script>

<style>
@import url('./assets/styles/fonts.css');
@import url('./assets/styles/root.css');
@import url('./assets/styles/buttons.css');
@import url('./assets/styles/notification.css');
@import url('./assets/styles/map.css');
.navigation-header + hr {
  margin-block: var(--header-horizontal-rule-margin-block);
  border-width: var(--header-horizontal-rule-border-width);
  opacity: 0.6;
}
.navigation-header + hr + main {
  height: calc(100% - var(--header-height) - var(--navbar-height) - var(--navbar-position-bottom));
  padding-top: 0;
}
</style>
