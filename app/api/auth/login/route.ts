import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { supabaseAdmin } from '@/lib/supabase'
import { signAdminToken, setAdminCookie } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const { username, password } = await req.json()

  if (!username || !password) {
    return NextResponse.json({ error: 'Username dan password wajib diisi' }, { status: 400 })
  }

  const db = supabaseAdmin()
  const { data, error } = await db
    .from('admin_config')
    .select('username, password_hash')
    .eq('id', 1)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: 'Admin belum dikonfigurasi' }, { status: 500 })
  }

  const valid =
    data.username === username &&
    (await bcrypt.compare(password, data.password_hash))

  if (!valid) {
    return NextResponse.json({ error: 'Username atau password salah' }, { status: 401 })
  }

  const token = await signAdminToken()
  setAdminCookie(token)

  return NextResponse.json({ ok: true })
}
