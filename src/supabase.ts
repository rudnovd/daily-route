import type { Database } from './types/supabase'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY
if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL and Key must be provided in environment variables')
}
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  db: {
    timeout: 15_000,
  },
  auth: {
    flowType: import.meta.env.VITE_IS_TAURI ? 'pkce' : 'implicit',
    storageKey: 'auth',
  },
})
