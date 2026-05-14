import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON_KEY      = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Gunakan POOL_URL jika tersedia (port 6543 Supabase Pooler / Supavisor)
// Jika tidak ada, fallback ke URL biasa
const POOL_URL = process.env.SUPABASE_POOL_URL || SUPABASE_URL

// Client browser - anon key, baca publik
export const supabase = createClient(SUPABASE_URL, ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
  db:   { schema: 'public' },
  global: {
    headers: { 'x-app-name': 'santri-app' },
  },
})

// Client server - service role, pakai connection pooler
// Dibuat per-request (tidak di-share antar request) agar thread-safe
export function supabaseAdmin() {
  return createClient(POOL_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    db:   { schema: 'public' },
    global: {
      headers: { 'x-app-name': 'santri-app-admin' },
    },
  })
}
