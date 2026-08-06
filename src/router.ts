import { createRouter, createWebHistory } from 'vue-router'
import { handleHotUpdate, routes } from 'vue-router/auto-routes'
import { DEFAULT_LOCALE } from './constants/locale'
import { i18n } from './i18n'

const BASE_PATH = i18n.global.locale.value !== DEFAULT_LOCALE ? i18n.global.locale.value : '/'
export const router = createRouter({
  history: createWebHistory(BASE_PATH),
  routes,
})

router.afterEach((to, _from, _next) => {
  const title = to.meta?.title ?? null
  document.title = title ? `Daily Route | ${i18n.global.t(title)}` : 'Daily Route'
})

if (import.meta.hot) {
  handleHotUpdate(router)
}
