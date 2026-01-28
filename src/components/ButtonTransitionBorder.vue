<template>
  <button
    ref="buttonElement"
    class="button-transition-border"
    @pointerdown="startTransition"
    @pointerup="stopTransition"
    @contextmenu="e => e.preventDefault()"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { useTemplateRef } from 'vue'

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
  buttonRef.value.classList.toggle('border-animation')
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
  buttonRef.value.classList.toggle('border-animation')
  buttonRef.value.onanimationend = null
}
</script>

<style>
@property --gradient-angle {
  syntax: "<angle>";
  initial-value: 0deg;
  inherits: false;
}
@keyframes change-gradient-angle {
  to {
    --gradient-angle: 360deg;
  }
}
.button-transition-border {
  border: 4px solid transparent;
  &.border-animation {
    color: oklch(100% 0 0deg);
    background:
      linear-gradient(var(--color-error), var(--color-error)) padding-box,
      conic-gradient(var(--color-accent) var(--gradient-angle), transparent calc(var(--gradient-angle) - 180deg)) border-box;
    animation: change-gradient-angle var(--duration-long) linear;
  }
}
</style>
