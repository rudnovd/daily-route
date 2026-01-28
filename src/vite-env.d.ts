/// <reference types="vite/client" />

interface ViteTypeOptions {
  strictImportMetaEnv: unknown
}
interface ImportMetaEnv {
  readonly VITE_MAPTILER_API_KEY: string
  readonly VITE_OPEN_ROUTE_SERVICE_KEY: string
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_KEY: string
  readonly VITE_IS_TAURI: string
  readonly VITE_GOOGLE_CLIENT_ID: string
  readonly VITE_SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET: string
  readonly VITE_GOOGLE_AUTH_CALLBACK: string
  readonly VITE_APP_VERSION: string
  readonly VITE_GIT_COMMIT_SHA: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
