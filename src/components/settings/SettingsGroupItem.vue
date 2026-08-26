<template>
  <li class="settings-group-item">
    <component
      :is="to ? RouterLink : 'button'"
      class="button-link settings-group-item__element"
      :class="{ 'button-link--disabled': disabled }"
      :to
    >
      <component :is="icon" />
      <span class="settings-group-item__element-text">{{ title }}</span>
      <IconChevronRight />
    </component>
  </li>
</template>

<script setup lang="ts">
import type { Component } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { RouterLink } from 'vue-router'
import IconChevronRight from '~icons/mdi/chevron-right'

defineProps<{
  icon: Component
  title: string
  disabled: boolean
  to?: RouteLocationRaw
}>()
</script>

<style>
.settings-group-item {
  display: flex;
  overflow: hidden;
  .settings-group-item__element {
    gap: 0.5rem;
    width: 100%;
    padding-block: 0.25rem;
    padding-inline: 0;
    .settings-group-item__element-text {
      flex: 1 0 0;
      overflow: hidden;
      text-overflow: ellipsis;
      text-align: left;
      white-space: nowrap;
    }
  }
}
</style>
