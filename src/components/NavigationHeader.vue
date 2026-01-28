<template>
  <header class="navigation-header">
    <button v-if="router.currentRoute.value.name !== '/'" class="icon-button icon-button--medium" @click="$router.back()">
      <MdiArrowLeftIcon />
    </button>
    <h1 v-if="router.currentRoute.value.meta.title">
      {{ $t(router.currentRoute.value.meta.title) }}
    </h1>
  </header>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import MdiArrowLeftIcon from '~icons/mdi/arrow-left'

const router = useRouter()
</script>

<style>
.navigation-header {
  display: grid;
  grid-template-columns: max-content 1fr;
  align-items: center;
  padding-inline: var(--content-padding-inline);
  padding-top: var(--navigation-header-padding-top);
  h1 {
    width: calc(100% - 3rem);
    margin: 0;
    overflow: hidden;
    text-overflow: clip;
    font-size: 1.6rem;
    text-align: center;
    white-space: nowrap;
  }
}
</style>
