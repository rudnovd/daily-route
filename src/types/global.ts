import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    displayTitle?: boolean
    isNavbarHidden?: boolean
    hideTopPadding?: boolean
  }
}
