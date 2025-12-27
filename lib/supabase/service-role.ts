import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

export function createServiceRoleClient() {
  if (typeof window !== 'undefined') {
    throw new Error('Service role client should only be used on the server')
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase service role configuration')
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
