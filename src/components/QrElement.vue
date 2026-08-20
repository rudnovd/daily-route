<template>
  <div>
    <div v-html="qr" />
    {{ $t('index.scanQr') }}
  </div>
</template>

<script setup lang="ts">
import qr from '@/assets/svg/qr.svg?raw'
</script>
