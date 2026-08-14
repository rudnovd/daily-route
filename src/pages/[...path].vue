<template>
  <section class="not-found-page">
    <MdiMapMarkerOffOutlineIcon />
    <span>{{ $t('notFound.index') }}</span>
    <router-link v-wave to="/" class="button-link button-primary">
      {{ $t('notFound.buttons.backToHome') }}
    </router-link>
  </section>
</template>

<script setup lang="ts">
import MdiMapMarkerOffOutlineIcon from '~icons/mdi/map-marker-off-outline'

definePage({ meta: { title: 'notFound.index', isNavbarHidden: true } })
</script>

<style>
.not-found-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  justify-content: center;
  padding-inline: var(--content-padding-inline);
  svg {
    width: 3rem;
    height: 3rem;
  }
}
</style>
