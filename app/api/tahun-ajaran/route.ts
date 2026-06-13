import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { isAdminFromRequest } from '@/lib/auth'

// GET /api/tahun-ajaran — cache 30 detik
export async function GET(req: NextRequest) {
  const aktifOnly = req.nextUrl.searchParams.get('aktif')

  let query = supabase
    .from('tahun_ajaran')
    .select('*')
    .order('tanggal_mulai', { ascending: false })

  if (aktifOnly) query = query.eq('aktif', true)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, {
  })
}

export async function POST(req: NextRequest) {
  if (!await isAdminFromRequest(req))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { nama, tanggal_mulai, tanggal_selesai, aktif } = await req.json()
  if (!nama || !tanggal_mulai || !tanggal_selesai)
    return NextResponse.json({ error: 'nama, tanggal_mulai, tanggal_selesai wajib' }, { status: 400 })

  const { data, error } = await supabaseAdmin()
    .from('tahun_ajaran')
    .insert({ nama, tanggal_mulai, tanggal_selesai, aktif: aktif || false })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  if (!await isAdminFromRequest(req))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID wajib' }, { status: 400 })

  const body = await req.json()
  const allowed = ['nama', 'tanggal_mulai', 'tanggal_selesai', 'aktif']
  const clean = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)))

  const { data, error } = await supabaseAdmin()
    .from('tahun_ajaran').update(clean).eq('id', id).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } })
}

export async function DELETE(req: NextRequest) {
  if (!await isAdminFromRequest(req))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID wajib' }, { status: 400 })

  const { data: ta } = await supabaseAdmin()
    .from('tahun_ajaran').select('aktif').eq('id', id).single()
  if (ta?.aktif)
    return NextResponse.json({ error: 'Tidak bisa menghapus tahun ajaran yang sedang aktif' }, { status: 400 })

  const { error } = await supabaseAdmin().from('tahun_ajaran').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
