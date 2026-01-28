<template>
  <div class="no-connection-badge">
    {{ $t('app.noConnection') }}
  </div>
</template>

<style>
.no-connection-badge {
  position: fixed;
  bottom: calc(64px + 64px + 4px);
  left: 50%;
  z-index: 1;
  max-width: 300px;
  padding-block: 0.75rem;
  padding-inline: 1.25rem;
  font-size: 13px;
  color: oklch(100% 0 0deg);
  background: var(--color-error);
  border-radius: 8px;
  transform: translateX(-50%);
}
</style>
