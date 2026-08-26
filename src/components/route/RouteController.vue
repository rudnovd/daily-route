<template>
  <div class="route-controller">
    <div>
      <ButtonTransitionBorder
        :disabled="isLoading || !userStore.isOnline"
        class="icon-button icon-button--large button-primary"
        @animationend="cancelRoute"
      >
        <IconStop @click.prevent />
      </ButtonTransitionBorder>
      {{ $t('index.buttons.cancel') }}
    </div>
    <div v-if="routeStore.status === 'started'">
      <button
        v-wave
        :disabled="isLoading || !userStore.isOnline"
        class="icon-button icon-button--large button-primary"
        @click="pauseRoute"
      >
        <IconPause />
      </button>
      {{ $t('index.buttons.pause') }}
    </div>
    <div v-else-if="routeStore.status === 'paused'">
      <button
        v-wave
        :disabled="isLoading || !userStore.isOnline"
        class="icon-button icon-button--large button-primary"
        @click="unpauseRoute"
      >
        <IconPlay />
      </button>
      {{ $t('index.buttons.continue') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { toast } from 'vue-sonner'
import IconPause from '~icons/mdi/pause'
import IconPlay from '~icons/mdi/play'
import IconStop from '~icons/mdi/stop'
import { useRouteStore } from '@/stores/route'
import { useUserStore } from '@/stores/user'
import ButtonTransitionBorder from '../ButtonTransitionBorder.vue'

const routeStore = useRouteStore()
const userStore = useUserStore()
const { t } = useI18n()

const isLoading = ref<boolean>(false)
async function cancelRoute() {
  if (!routeStore.state) {
    return
  }
  try {
    isLoading.value = true
    await routeStore.cancelRoute(routeStore.state.id)
    toast.success(t('index.routeCancelled'))
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
async function pauseRoute() {
  if (!routeStore.state) {
    return
  }
  try {
    isLoading.value = true
    await routeStore.pauseRoute(routeStore.state.id)
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
async function unpauseRoute() {
  if (!routeStore.state) {
    return
  }
  try {
    isLoading.value = true
    await routeStore.unpauseRoute(routeStore.state.id)
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
.route-controller {
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: 100%;
  user-select: none;
  div {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    align-items: center;
  }
}
</style>
