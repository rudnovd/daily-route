<template>
  <section class="settings-group">
    <h2 class="settings-group__title">
      {{ title }}
    </h2>
    <ul>
      <slot />
    </ul>
  </section>
</template>

<script setup lang="ts">
defineProps<{ title: string }>()
</script>

<style>
.settings-group {
  padding: 0.5rem;
  background: var(--color-surface-background);
  border-radius: 8px;
  ul {
    display: grid;
    gap: 0.5rem;
  }
  .settings-group__title {
    margin: 0;
    margin-bottom: 0.5rem;
    font-size: 1.3rem;
    font-weight: 600;
  }
}
</style>
