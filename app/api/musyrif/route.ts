import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { isAdminFromRequest } from '@/lib/auth'

// GET /api/musyrif — semua musyrif aktif
export async function GET() {
  const { data, error } = await supabase
    .from('musyrif').select('*').eq('aktif', true).order('nama')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } })
}

// POST — tambah musyrif baru
export async function POST(req: NextRequest) {
  if (!await isAdminFromRequest(req))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { nama, no_hp } = await req.json()
  if (!nama?.trim())
    return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 })
  const { data, error } = await supabaseAdmin()
    .from('musyrif').insert({ nama: nama.trim(), no_hp: no_hp?.trim() || '' })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// PATCH — edit musyrif
export async function PATCH(req: NextRequest) {
  if (!await isAdminFromRequest(req))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID wajib' }, { status: 400 })
  const { nama, no_hp } = await req.json()
  const { data, error } = await supabaseAdmin()
    .from('musyrif').update({ nama: nama?.trim(), no_hp: no_hp?.trim() || '' })
    .eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } })
}

// DELETE — soft delete musyrif
export async function DELETE(req: NextRequest) {
  if (!await isAdminFromRequest(req))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID wajib' }, { status: 400 })
  const { error } = await supabaseAdmin()
    .from('musyrif').update({ aktif: false }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
