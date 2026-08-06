<template>
  <section class="settings-page">
    <ul>
      <li>
        <router-link
          class="button-link settings-page__element"
          :class="{ 'button-link--disabled': isLoading }"
          to="/settings/locale"
        >
          <MdiTranslateIcon />
          <span class="settings-page__element-text">{{ $t('settings.locale.title') }}</span>
          <MdiChevronRightIcon />
        </router-link>
      </li>
      <li>
        <router-link
          class="button-link settings-page__element"
          :class="{ 'button-link--disabled': isLoading || !!routeStore.path }"
          to="/settings/edit?target=start"
        >
          <MdiMapMarkerIcon />
          <span class="settings-page__element-text">{{ $t('settings.startPoint.title') }}</span>
          <MdiChevronRightIcon />
        </router-link>
      </li>
      <li>
        <router-link
          class="button-link settings-page__element"
          :class="{ 'button-link--disabled': isLoading || !!routeStore.path }"
          to="/settings/edit?target=radius"
        >
          <MdiMapMarkerRadiusIcon />
          <span class="settings-page__element-text">{{ $t('settings.radius.title') }}</span>
          <MdiChevronRightIcon />
        </router-link>
      </li>
      <li>
        <router-link
          class="button-link settings-page__element"
          :class="{ 'button-link--disabled': isLoading || !!routeStore.path }"
          to="/onboarding"
        >
          <MdiSchoolIcon />
          <span class="settings-page__element-text">{{ $t('settings.onboarding.title') }}</span>
          <MdiChevronRightIcon />
        </router-link>
      </li>
      <li v-if="userStore.user">
        <ButtonTransitionIcon
          size="0.8em"
          :disabled="!userStore.isOnline"
          class="settings-page__element"
          @transitionend="signOut"
        >
          <MdiLogoutIcon />
          <span class="settings-page__element-text">{{ $t('settings.signOut.title') }}</span>
          <MdiChevronRightIcon />
        </ButtonTransitionIcon>
      </li>
    </ul>
    <span class="version">
      {{ VITE_APP_VERSION }} ({{ VITE_GIT_COMMIT_SHA }})
    </span>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import MdiChevronRightIcon from '~icons/mdi/chevron-right'
import MdiLogoutIcon from '~icons/mdi/logout'
import MdiMapMarkerIcon from '~icons/mdi/map-marker'
import MdiMapMarkerRadiusIcon from '~icons/mdi/map-marker-radius'
import MdiSchoolIcon from '~icons/mdi/school'
import MdiTranslateIcon from '~icons/mdi/translate'
import ButtonTransitionIcon from '@/components/ButtonTransitionIcon.vue'
import { useRouteStore } from '@/stores/route'
import { useUserStore } from '@/stores/user'

definePage({ meta: { title: 'settings.title' } })

const { VITE_APP_VERSION, VITE_GIT_COMMIT_SHA } = import.meta.env
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
  grid-template-rows: 1fr auto;
  align-items: start;
  padding-inline: var(--content-padding-inline);
  ul {
    display: grid;
    gap: 1rem;
    li {
      display: flex;
      overflow: hidden;
      .settings-page__element {
        gap: 0.5rem;
        width: 100%;
        padding-block: 0.25rem;
        padding-inline: 0;
        .settings-page__element-text {
          flex: 1 0 0;
          overflow: hidden;
          text-overflow: ellipsis;
          text-align: left;
          white-space: nowrap;
        }
      }
      .button-transition-icon {
        width: 100%;
      }
    }
  }
  .version {
    font-size: 0.8rem;
    text-align: center;
  }
}
</style>
