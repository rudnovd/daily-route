import { createRouter, createWebHistory } from 'vue-router'
import { handleHotUpdate, routes } from 'vue-router/auto-routes'
import { i18n } from './i18n'

export const router = createRouter({
  history: createWebHistory('/'),
  routes,
})
router.afterEach((to, _from, _next) => {
  const title = to.meta?.title ?? null
  document.title = title ? `Daily Route | ${i18n.global.t(title)}` : 'Daily Route'
})

if (import.meta.hot) {
  handleHotUpdate(router)
}
