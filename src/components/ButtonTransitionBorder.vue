<template>
  <button
    ref="buttonElement"
    v-wave
    class="button-transition-border"
    @pointerdown="startTransition"
    @pointerup="stopTransition"
    @pointercancel="stopTransition"
    @pointerleave="stopTransition"
    @contextmenu.prevent
  >
    <slot />
    <IconGestureTapHold class="tap-hold-icon" />
  </button>
</template>

<script setup lang="ts">
import { useTemplateRef } from 'vue'
import IconGestureTapHold from '~icons/mdi/gesture-tap-hold'

const emit = defineEmits<{ animationend: [] }>()

const buttonRef = useTemplateRef('buttonElement')
function startTransition(event: PointerEvent) {
  if (!buttonRef.value) {
    return
  }
  if (event.cancelable) {
    event.preventDefault()
  }
  event.stopPropagation()
  buttonRef.value.classList.add('border-animation')
  buttonRef.value.onanimationend = () => {
    emit('animationend')
  }
}
function stopTransition(event: PointerEvent) {
  if (!buttonRef.value) {
    return
  }
  if (event.cancelable) {
    event.preventDefault()
  }
  event.stopPropagation()
  buttonRef.value.classList.remove('border-animation')
  buttonRef.value.onanimationend = null
}
</script>

<style>
@property --gradient-angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}
@keyframes change-gradient-angle {
  to {
    --gradient-angle: 360deg;
  }
}
.button-transition-border {
  position: relative;
  border: 4px solid transparent;
  transition: transform 0.5s;
  &:active {
    transform: scale(0.98);
  }
  .tap-hold-icon {
    position: absolute;
    right: 0;
    bottom: 0;
    width: 1em;
    height: 1em;
  }
  &.border-animation {
    color: oklch(100% 0 0deg);
    background:
      linear-gradient(var(--color-error), var(--color-error)) padding-box,
      conic-gradient(var(--color-accent) var(--gradient-angle), transparent calc(var(--gradient-angle) - 180deg))
        border-box;
    animation: change-gradient-angle var(--duration-long) linear;
  }
}
</style>
