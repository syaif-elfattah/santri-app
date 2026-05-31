import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { isAdminFromRequest } from '@/lib/auth'

// GET /api/kelas-musyrif?kelas_id=xxx — musyrif di kelas tertentu
export async function GET(req: NextRequest) {
  const kelas_id = req.nextUrl.searchParams.get('kelas_id')
  let q = supabase
    .from('kelas_musyrif')
    .select('id, kelas_id, musyrif_id, musyrif(id, nama, no_hp)')
  if (kelas_id) q = q.eq('kelas_id', kelas_id)
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST — assign musyrif ke kelas
export async function POST(req: NextRequest) {
  if (!await isAdminFromRequest(req))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { kelas_id, musyrif_id } = await req.json()
  if (!kelas_id || !musyrif_id)
    return NextResponse.json({ error: 'kelas_id dan musyrif_id wajib' }, { status: 400 })
  const { data, error } = await supabaseAdmin()
    .from('kelas_musyrif').insert({ kelas_id, musyrif_id })
    .select('id, kelas_id, musyrif_id, musyrif(id, nama, no_hp)').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// DELETE — unassign musyrif dari kelas
export async function DELETE(req: NextRequest) {
  if (!await isAdminFromRequest(req))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID wajib' }, { status: 400 })
  const { error } = await supabaseAdmin()
    .from('kelas_musyrif').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
