<template>
  <section class="settings-page">
    <SettingsGroup :title="$t('settings.groups.dailyRoute')">
      <SettingsGroupItem
        :icon="IconMapMarker"
        :title="$t('settings.startPoint.title')"
        :disabled="isLoading || !!routeStore.path"
        to="/settings/start"
      />
      <SettingsGroupItem
        :icon="IconRuler"
        :title="$t('settings.maxDistance.title')"
        :disabled="isLoading || !!routeStore.path"
        to="/settings/radius"
      />
    </SettingsGroup>
    <SettingsGroup :title="$t('settings.groups.preferences')">
      <SettingsGroupItem
        :icon="IconTranslate"
        :title="$t('settings.locale.title')"
        :disabled="isLoading"
        to="/settings/locale"
      />
    </SettingsGroup>
    <SettingsGroup :title="$t('settings.groups.actions')">
      <SettingsGroupItem
        :icon="IconSchool"
        :title="$t('settings.onboarding.title')"
        :disabled="isLoading || !!routeStore.path"
        to="/onboarding"
      />
      <SettingsGroupItem
        v-if="userStore.user"
        :icon="IconLogout"
        :title="$t('settings.signOut.title')"
        :disabled="isLoading || !userStore.isOnline"
        @click="isSignOutDialogActive = true"
      />
    </SettingsGroup>
    <footer class="settings-page__footer">
      <a
        v-if="!VITE_IS_TAURI"
        class="color-accent app-link"
        href="https://github.com/rudnovd/daily-route/releases/latest"
        target="_blank"
      >
        {{ $t('settings.androidApp') }}
      </a>
      <a href="https://github.com/rudnovd/daily-route" class="color-secondary version">
        {{ VITE_APP_VERSION }} ({{ VITE_GIT_COMMIT_SHA }})
      </a>
      </component>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import IconLogout from '~icons/mdi/logout'
import IconMapMarker from '~icons/mdi/map-marker'
import IconRuler from '~icons/mdi/ruler'
import IconSchool from '~icons/mdi/school'
import IconTranslate from '~icons/mdi/translate'
import SettingsGroup from '@/components/settings/SettingsGroup.vue'
import SettingsGroupItem from '@/components/settings/SettingsGroupItem.vue'
import { useRouteStore } from '@/stores/route'
import { useUserStore } from '@/stores/user'

definePage({ meta: { title: 'settings.title', displayTitle: true } })

const { VITE_APP_VERSION, VITE_GIT_COMMIT_SHA, VITE_IS_TAURI } = import.meta.env
const { t } = useI18n()
const userStore = useUserStore()
const routeStore = useRouteStore()
const router = useRouter()

const isLoading = ref<boolean>(false)
async function signOut(): Promise<void> {
  isLoading.value = true
  try {
    if (routeStore.state) {
      await routeStore.finishRoute(routeStore.state.id)
    }
  }
  finally {
    try {
      await userStore.signOut()
      toast.success(t('settings.signOut.notifications.signOutFromAccountSuccess'))
      router.push('/')
    }
    catch {
      toast.error(t('settings.signOut.notifications.signOutFromAccountError'))
    }
    finally {
      isLoading.value = false
    }
  }
}
</script>

<style>
.settings-page {
  display: grid;
  grid-template-rows: auto auto 1fr auto;
  gap: 2rem;
  align-items: start;
  padding-inline: var(--content-padding-inline);
  .settings-page__footer {
    display: grid;
    gap: 0.5rem;
    justify-content: center;
    .app-link,
    .version {
      font-weight: 700;
    }
    .version {
      font-size: 0.8rem;
      text-align: center;
    }
  }
}
</style>
