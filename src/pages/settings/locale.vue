<template>
  <section class="settings-locale-page">
    <form>
      <fieldset>
        <legend>{{ $t('settings.locale.selectLocale') }}</legend>
        <template v-for="locale in locales" :key="locale.value">
          <input
            :id="`locale-${locale.value}`"
            :checked="userStore.settings.locale === locale.value"
            type="radio"
            name="locale"
            :value="locale.value"
            @change="setLocale"
          >
          <label :for="`locale-${locale.value}`">{{ locale.title }}</label>
        </template>
      </fieldset>
    </form>
  </section>
</template>

<script setup lang="ts">
import type { Locale } from 'vue-i18n'
import { useUserStore } from '@/stores/user'

definePage({ meta: { title: 'settings.locale.title', displayTitle: true } })

const userStore = useUserStore()
const locales: ReadonlyArray<{ title: string, value: Locale }> = [
  { title: 'English', value: 'en' },
  { title: 'Русский', value: 'ru' },
]
function setLocale(event: Event) {
  const target = event.target as HTMLInputElement
  userStore.changeLocale(target.value)
  location.replace(location.href)
}
</script>

<style>
.settings-locale-page {
  fieldset {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 1rem;
    border: none;
    input {
      transform: scale(1.2);
    }
  }
}
</style>
