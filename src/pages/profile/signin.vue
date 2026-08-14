<template>
  <section class="signin-page">
    <button
      v-wave
      class="button-primary"
      :disabled="isLoading || !userStore.isOnline"
      @click="signIn('google')"
    >
      {{ $t('profile.signIn.buttons.signInWithGoogle') }}
    </button>
    <button
      v-wave
      class="button-primary"
      :disabled="isLoading || !userStore.isOnline"
      @click="signIn('anonymously')"
    >
      {{ $t('profile.signIn.buttons.continueAnonymously') }}
    </button>
  </section>
</template>

<script setup lang="ts">
import { whenever } from '@vueuse/core'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { useUserStore } from '@/stores/user'

definePage({
  meta: { title: 'profile.signIn.title', displayTitle: true },
  beforeEnter() {
    if (useUserStore().isAuthenticated) {
      return '/'
    }
  },
})

const { t } = useI18n()
const userStore = useUserStore()
const router = useRouter()
const isLoading = ref<boolean>(false)
async function signIn(type: 'google' | 'anonymously') {
  try {
    isLoading.value = true
    type === 'google' ? await userStore.signInWithOAuth({ provider: 'google' }) : await userStore.signInAnonymously()
  }
  catch (error) {
    console.error(error)
    toast.error(t('profile.signIn.notifications.failedToSignedIn'))
  }
  finally {
    isLoading.value = false
  }
}
whenever(() => userStore.isAuthenticated, () => {
  router.push('/')
})
</script>

<style>
.signin-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: var(--content-padding-inline);
}
</style>
