<template>
  <div class="button-transition-icon">
    <div class="transition-container">
      <Transition name="walk">
        <div
          v-if="isActive"
          class="transition-container__element"
          @transitionstart="clear"
          @transitionend="emitTransitionEnd"
        >
          <Icon icon="mdi:walk" />
          <div class="transition-container__element-road-container">
            <span class="transition-container__element-road" />
          </div>
          <Icon icon="mdi:map-marker" />
        </div>
      </Transition>
    </div>
    <button
      v-wave
      v-bind="$attrs"
      class="button-transition-icon__button"
      @pointerdown="startButtonTransition"
      @pointerup="stopButtonTransition"
      @pointercancel="stopButtonTransition"
      @pointerleave="stopButtonTransition"
      @contextmenu.prevent
    >
      <slot />
      <Icon icon="mdi:gesture-tap-hold" class="tap-hold-icon" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

defineOptions({ inheritAttrs: false })

withDefaults(defineProps<{ size?: string }>(), { size: '1.3em' })

const emit = defineEmits<{ transitionend: [] }>()
const userStore = useUserStore()
const router = useRouter()

const isActive = ref<boolean>(false)
function startButtonTransition(event: PointerEvent) {
  if (!userStore.isAuthenticated) {
    return router.push('/profile/signin')
  }
  if (event.cancelable) {
    event.preventDefault()
  }
  event.stopPropagation()
  isActive.value = true
}
function stopButtonTransition(event: PointerEvent) {
  if (event.cancelable) {
    event.preventDefault()
  }
  event.stopPropagation()
  isActive.value = false
}
const transitionCompletedSteps = ref<Array<boolean>>([])
function clear() {
  transitionCompletedSteps.value = []
}
function emitTransitionEnd() {
  transitionCompletedSteps.value.push(true)
  if (transitionCompletedSteps.value.length === 2) {
    isActive.value = false
    emit('transitionend')
  }
}
</script>

<style>
.button-transition-icon {
  --size: v-bind(size);
  .transition-container {
    height: var(--size);
  }
  .transition-container__element {
    display: grid;
    grid-template-columns: var(--size) calc(100% - var(--size) - var(--size)) var(--size);
    .transition-container__element-road-container {
      display: flex;
      justify-content: center;
    }
    svg {
      width: var(--size);
      height: var(--size);
      margin-left: auto;
    }
  }
  .transition-container__element-road {
    border-bottom: calc(var(--size) / 5) dotted var(--color-text);
  }
  .button-transition-icon__button {
    position: relative;
    width: 100%;
    transition: transform 0.5s;
    &:active {
      transform: scale(0.98);
    }
    .tap-hold-icon {
      position: absolute;
      right: 2px;
      bottom: 2px;
      width: 1em;
      height: 1em;
    }
  }
  .walk-enter-active {
    &.transition-container__element {
      transition: grid-template-columns var(--duration-long);
      transition-delay: 1s;
    }
    .transition-container__element-road {
      transition: width 1s;
    }
  }
  .walk-leave-active {
    &.transition-container__element {
      transition: grid-template-columns 1s;
    }
    .transition-container__element-road {
      transition: width 1s;
    }
  }
  .walk-enter-from {
    &.transition-container__element {
      grid-template-columns: var(--size) calc(100% - var(--size) - var(--size)) var(--size);
    }
    .transition-container__element-road {
      width: 0;
    }
  }
  .walk-enter-to {
    &.transition-container__element {
      grid-template-columns: calc(100% - var(--size)) 0 var(--size);
    }
    .transition-container__element-road {
      width: 100%;
    }
  }
  .walk-leave-to {
    &.transition-container__element {
      grid-template-columns: var(--size) calc(100% - var(--size) - var(--size)) var(--size);
    }
    .transition-container__element-road {
      width: 0;
    }
  }
}
</style>
