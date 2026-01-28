<template>
  <section class="onboarding-page">
    <div>
      <img src="/favicon.svg" alt="Logo">
      <h1>Daily Route</h1>
    </div>
    <i18n-t keypath="onboarding.description[0]" tag="p">
      <template #app>
        <span>Daily Route</span>
      </template>
    </i18n-t>
    <p>{{ $t('onboarding.description[1]') }}</p>
    <p>{{ $t('onboarding.description[2]') }}!</p>
    <button class="button-primary" @click="onboarding.start()">
      {{ $t('onboarding.buttons.start') }}
    </button>
  </section>
</template>

<script setup lang="ts">
import { useOnboarding } from '@/composables/useOnboarding'

definePage({ meta: { isNavbarHidden: true } })

const onboarding = useOnboarding()
</script>

<style>
.onboarding-page {
  display: grid;
  gap: 1rem;
  place-content: center;
  padding-inline: var(--content-padding-inline);
  line-height: 1.5;
  & > div {
    display: grid;
    justify-items: center;
  }
  h1 {
    margin: 0;
    color: var(--color-accent);
  }
  p {
    margin: 0;
    text-wrap-style: balance;
    span {
      font-weight: bold;
      color: var(--color-accent);
    }
  }
  img {
    width: 50%;
    height: auto;
  }
  button {
    width: 100%;
  }
}
</style>
