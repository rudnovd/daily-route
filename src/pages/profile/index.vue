<template>
  <section class="profile-page">
    <div class="profile-user-data">
      <figure class="profile-user-data__avatar">
        <img
          v-if="userStore.user?.user_metadata.avatar_url"
          :src="userStore.user.user_metadata.avatar_url"
          :alt="`${userStore.user?.user_metadata.name}'s avatar`"
          class="profile-user-data__img"
        >
        <MdiAccountCircleIcon v-else class="profile-user-data__img" />
        <figcaption class="profile-user-data__name">
          {{ userStore.user?.user_metadata.name || $t('profile.anonymous') }}
        </figcaption>
      </figure>
      <button
        v-if="userStore.user?.is_anonymous"
        class="button-primary"
        :disabled="isLoading || !!routeStore.path || !userStore.isOnline"
        @click="linkAccountToGoogle"
      >
        {{ $t('profile.linkAccountToGoogle') }}
      </button>
    </div>
    <hr>
    <div class="profile-streak-data">
      <div class="profile-streak-data__days">
        {{ $t('profile.currentStreak') }}:
        <span class="tabular-num">{{ userStore.daysStreak }}</span>
      </div>
      <StreakCalendar />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'
import MdiAccountCircleIcon from '~icons/mdi/account-circle'
import StreakCalendar from '@/components/profile/StreakCalendar.vue'
import { useRouteStore } from '@/stores/route'
import { useUserStore } from '@/stores/user'
import { supabase } from '@/supabase'

definePage({
  meta: { title: 'profile.title', displayTitle: true },
  beforeEnter() {
    const userStore = useUserStore()
    if (!userStore.isAuthenticated) {
      return '/profile/signin'
    }
  },
})

const routeStore = useRouteStore()
const userStore = useUserStore()
const isLoading = ref<boolean>(false)
async function linkAccountToGoogle() {
  try {
    isLoading.value = true
    await supabase.auth.linkIdentity({
      provider: 'google',
      options: {
        skipBrowserRedirect: true,
      },
    })
  }
  catch (error) {
    if (error instanceof Error) {
      toast.error(error.message)
    }
  }
  finally {
    isLoading.value = false
  }
}
</script>

<style>
.profile-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-inline: var(--content-padding-inline);
  .profile-user-data {
    display: grid;
    gap: 0.5rem;
    .profile-user-data__avatar {
      display: grid;
      justify-items: center;
      margin: 0;
      .profile-user-data__img {
        width: 8rem;
        height: 8rem;
        border-radius: 50%;
      }
      .profile-user-data__name {
        font-size: 2rem;
      }
    }
  }
  hr {
    width: 100%;
  }
  .profile-streak-data {
    display: grid;
    gap: 0.5rem;
    justify-items: center;
    .profile-streak-data__days {
      font-size: 2rem;
    }
  }
}
</style>
