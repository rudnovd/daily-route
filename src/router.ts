import { createRouter, createWebHistory } from 'vue-router'
import { handleHotUpdate, routes } from 'vue-router/auto-routes'
import { DEFAULT_LOCALE } from './constants/locale'
import { i18n } from './i18n'

const BASE_PATH = i18n.global.locale.value !== DEFAULT_LOCALE ? i18n.global.locale.value : '/'
export const router = createRouter({
  history: createWebHistory(BASE_PATH),
  routes,
})

if (import.meta.hot) {
  handleHotUpdate(router)
}
