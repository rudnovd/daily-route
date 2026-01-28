import type { Locale } from 'vue-i18n'
import { createI18n } from 'vue-i18n'

const DEFAULT_LOCALE: Locale = 'en'
const AVAILABLE_LOCALES: ReadonlyArray<Locale> = ['en', 'ru']
export function getAppLocale(): Locale {
  const userSettings = localStorage.getItem('settings')
  if (userSettings) {
    const userLocale: Locale = JSON.parse(userSettings).locale
    return AVAILABLE_LOCALES.includes(userLocale) ? userLocale : DEFAULT_LOCALE
  }
  const { language } = new Intl.Locale(navigator.language)
  return AVAILABLE_LOCALES.includes(language) ? language : DEFAULT_LOCALE
}
export const i18n = createI18n({
  legacy: false,
  locale: getAppLocale(),
  fallbackLocale: DEFAULT_LOCALE,
  availableLocales: AVAILABLE_LOCALES,
})
export async function loadLocaleMessages(locale: Locale): Promise<Record<string, any>> {
  return await import(`./locales/${locale}.json`, { with: { type: 'json' } })
}
export async function setLocale(locale: Locale) {
  const messages = await loadLocaleMessages(locale)
  i18n.global.setLocaleMessage(locale, messages.default)
  i18n.global.locale.value = locale
  document.documentElement.setAttribute('lang', locale)
}
