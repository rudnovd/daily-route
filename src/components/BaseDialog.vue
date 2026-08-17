<template>
  <dialog
    v-bind="$attrs"
    ref="dialogElement"
    class="base-dialog"
    :class="[`size--${size}`, { fullscreen }]"
    @close="close"
    @cancel="cancel"
  >
    <header v-if="title || closable" class="base-dialog__header">
      <slot name="header">
        <h2 v-if="title">
          {{ title }}
        </h2>
      </slot>
      <button
        v-if="closable"
        type="button"
        class="base-dialog__close-button"
        @click="close"
      >
        ×
      </button>
    </header>
    <div class="base-dialog__content">
      <slot />
    </div>
    <footer v-if="$slots.footer" class="base-dialog__footer">
      <slot name="footer" />
    </footer>
  </dialog>
</template>

<script setup lang="ts">
import { nextTick, useTemplateRef, watch } from 'vue'

interface Props {
  title?: string
  closable?: boolean
  size?: 'small' | 'medium' | 'large'
  fullscreen?: boolean
}
defineOptions({ inheritAttrs: false })
withDefaults(defineProps<Props>(), { title: '', closable: true, fullscreen: false, size: 'medium' })
const model = defineModel<boolean>({ required: true })

const dialogRef = useTemplateRef('dialogElement')

function close() {
  model.value = false
}
function cancel() {
  model.value = false
}
watch(model, async (open) => {
  await nextTick()
  if (!dialogRef.value) {
    return
  }
  if (open && !dialogRef.value.open) {
    dialogRef.value.showModal()
  }
  if (!open && dialogRef.value.open) {
    dialogRef.value.close()
  }
}, { immediate: true })
</script>

<style>
.base-dialog {
  width: 100%;
  padding: 0;
  outline: none;
  background: var(--color-surface-background);
  border-color: var(--color-border);
  border-radius: 8px;
  &.size--small {
    max-width: calc(60% - 2em - 6px);
  }
  &.size--medium {
    max-width: calc(80% - 2em - 6px);
  }
  &.size--large {
    max-width: calc(100% - 2em - 6px);
  }
  &.fullscreen {
    max-width: 100%;
    max-height: 100%;
    margin: 0;
  }
  &::backdrop {
    background: rgb(0 0 0 / 50%);
  }
  .base-dialog__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--content-padding-inline);
    border-bottom: 1px solid #eee;
    h2 {
      margin: 0;
    }
  }
  .base-dialog__close-button {
    font-size: 24px;
    cursor: pointer;
    background: transparent;
    border: 0;
  }
  .base-dialog__content {
    padding: var(--content-padding-inline);
  }
  .base-dialog__footer {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    padding: 16px 20px;
    border-top: 1px solid #eee;
  }
}
</style>
