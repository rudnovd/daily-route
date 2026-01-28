import { useLocalStorage } from '@vueuse/core'

export const selectedLocale = useLocalStorage<string | null>('locale', null, {
  listenToStorageChanges: false,
})
