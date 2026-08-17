<template>
  <nav class="navbar">
    <ul class="navbar__list">
      <li>
        <router-link v-wave class="button-link" to="/">
          <Icon icon="mdi:map-marker" />
          <span>{{ $t('index.title') }}</span>
        </router-link>
      </li>
      <li>
        <router-link v-wave class="button-link" to="/profile">
          <img
            v-if="userStore.user?.user_metadata.avatar_url"
            :src="userStore.user.user_metadata.avatar_url"
            :alt="`${userStore.user?.user_metadata.name}'s avatar`"
          >
          <Icon v-else icon="mdi:account" />
          <span>{{ $t('profile.title') }}</span>
        </router-link>
      </li>
      <li>
        <router-link v-wave class="button-link" to="/settings">
          <Icon icon="mdi:cog" />
          <span>{{ $t('settings.title') }}</span>
        </router-link>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
</script>

<style>
.navbar {
  position: fixed;
  bottom: var(--navbar-position-bottom);
  left: 16px;
  display: flex;
  width: calc(100% - 32px);
  height: 64px;
  padding-inline: 1rem;
  background-color: var(--color-surface-background);
  border: 1px solid var(--color-text-muted);
  border-radius: 8px;
  .navbar__list {
    display: flex;
    flex: 1;
    align-items: center;
    justify-content: space-evenly;
    a {
      flex-direction: column;
      padding-block: 0.25rem;
      padding-inline: 0;
      font-size: 0.8rem;
      opacity: 0.6;
      &.router-link-active {
        padding-inline: 1rem;
        color: oklch(21.01% 0.0318 264.66deg);
        background: var(--color-accent);
        border: 1px solid var(--color-text);
        opacity: 1;
      }
      svg,
      img {
        width: 1.5em;
        height: 1.5em;
      }
      img {
        border-radius: 50%;
      }
    }
  }
}
</style>
