import type { ResendParams, SignInAnonymouslyCredentials, SignInWithOAuthCredentials, SignInWithPasswordCredentials, SignUpWithPasswordCredentials, User, UserAttributes } from '@supabase/supabase-js'
import type { BBox, Feature, Position } from 'geojson'
import type { Ref } from 'vue'
import type { Locale } from 'vue-i18n'
import { openUrl } from '@tauri-apps/plugin-opener'
import { useLocalStorage, useOnline } from '@vueuse/core'
import { defineStore } from 'pinia'
import { getRoutesStreak } from '@/api/userRoute'
import { getAppLocale } from '@/i18n'
import { supabase } from '@/supabase'

interface UserSettings {
  locale: Locale
  dailyRouteStartGeometry: Feature<GeoJSON.Point, { radiusBbox: BBox | null }> | null
  isRoutePathVisible: boolean
}

interface UserState {
  user: User | null
  isOnline: Ref<boolean>
  daysStreak: ReturnType<typeof useLocalStorage<number>>
  settings: ReturnType<typeof useLocalStorage<UserSettings>>
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    user: null,
    isOnline: useOnline(),
    daysStreak: useLocalStorage<number>('daysStreak', 0),
    settings: useLocalStorage<UserSettings>('settings', {
      locale: getAppLocale(),
      dailyRouteStartGeometry: null,
      isRoutePathVisible: true,
    }),
  }),
  getters: {
    isAuthenticated(): boolean {
      return !!this.user?.id
    },
    dailyRouteStartPosition(): Position | null {
      return this.settings.dailyRouteStartGeometry?.geometry.coordinates ?? null
    },
    radiusBbox(): BBox | null {
      return this.settings.dailyRouteStartGeometry?.properties.radiusBbox ?? null
    },
  },
  actions: {
    async signIn(payload: SignInWithPasswordCredentials): Promise<User | null> {
      const { data: { user }, error } = await supabase.auth.signInWithPassword(payload)
      if (error) {
        throw error
      }
      this.user = user
      return this.user
    },
    async signInWithOAuth({ provider }: SignInWithOAuthCredentials): Promise<void> {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          skipBrowserRedirect: !!import.meta.env.VITE_IS_TAURI,
          scopes: provider === 'google' ? 'profile email' : '',
          redirectTo: import.meta.env.VITE_IS_TAURI ? 'dailyrouteapp://auth/callback' : window.location.origin,
        },
      })
      if (error) {
        throw error
      }
      if (import.meta.env.VITE_IS_TAURI) {
        if (!data.url) {
          throw new Error('OAuth url is missing')
        }
        await openUrl(data.url)
      }
    },
    async signInAnonymously(options?: SignInAnonymouslyCredentials['options']) {
      const { data, error } = await supabase.auth.signInAnonymously({ options })
      if (error) {
        throw error
      }
      this.user = data.user
      return data.user
    },
    async getSession() {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        throw error
      }
      if (session) {
        this.user = session.user
      }
      return session
    },
    async signUp(credentials: SignUpWithPasswordCredentials): Promise<User | null> {
      const { data: { user }, error } = await supabase.auth.signUp(credentials)
      if (error) {
        throw error
      }
      this.user = user
      return this.user
    },
    async sendEmailConfirmation(options: ResendParams['options']): Promise<string | null | undefined> {
      if (!this.user?.email) {
        throw new Error('Email not found')
      }
      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email: this.user.email,
        options: {
          ...options,
          emailRedirectTo: window.location.origin,
        },
      })
      if (error) {
        throw error
      }
      return data.messageId
    },
    async signOut(): Promise<User | null> {
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw error
      }
      this.user = null
      return this.user
    },
    async resetPassword(payload: { email: string, captchaToken: string }): Promise<void> {
      const { error } = await supabase.auth.resetPasswordForEmail(
        payload.email,
        {
          captchaToken: payload.captchaToken,
        },
      )
      if (error) {
        throw error
      }
    },
    async update(payload: UserAttributes): Promise<User | null> {
      const { data: { user }, error } = await supabase.auth.updateUser(payload)
      if (error) {
        throw error
      }
      this.user = user
      return this.user
    },
    async refreshSession(): Promise<User | null> {
      const { data: { session }, error } = await supabase.auth.getSession()
      if (error) {
        throw error
      }
      const { data: { user }, error: refreshSessionError } = await supabase.auth.refreshSession({
        refresh_token: session?.refresh_token ?? '',
      })
      if (refreshSessionError) {
        throw refreshSessionError
      }
      this.user = user
      return this.user
    },
    async changeLocale(locale: Locale) {
      this.settings.locale = locale
    },
    async getDaysStreak(): Promise<number> {
      const count = await getRoutesStreak()
      this.daysStreak = count ?? this.daysStreak
      return this.daysStreak
    },
  },
})
