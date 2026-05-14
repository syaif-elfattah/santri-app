import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { isAdminFromRequest } from '@/lib/auth'

// GET /api/prestasi?santri_id=xxx&tahun_ajaran_id=xxx
export async function GET(req: NextRequest) {
  const santri_id       = req.nextUrl.searchParams.get('santri_id')
  const tahun_ajaran_id = req.nextUrl.searchParams.get('tahun_ajaran_id')

  if (santri_id) {
    let q = supabase
      .from('prestasi')
      .select('*, tahun_ajaran(id, nama)')
      .eq('santri_id', santri_id)
      .order('created_at', { ascending: false })

    if (tahun_ajaran_id) q = q.eq('tahun_ajaran_id', tahun_ajaran_id)

    const { data, error } = await q
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  const { data, error } = await supabase.from('rekap_santri').select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST — input prestasi baru (musyrif, tanpa login)
export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    santri_id, tahun_ajaran_id,
    kegiatan_sekolah, kegiatan_pondok,
    prestasi_tahfidz, prestasi_non_tahfidz,
    progres_pribadi
  } = body

  if (!santri_id)
    return NextResponse.json({ error: 'santri_id wajib' }, { status: 400 })

  // Kalau tidak ada tahun_ajaran_id, ambil yang aktif
  let ta_id = tahun_ajaran_id
  if (!ta_id) {
    const { data: ta } = await supabaseAdmin()
      .from('tahun_ajaran').select('id').eq('aktif', true).single()
    ta_id = ta?.id || null
  }

  const { data, error } = await supabaseAdmin()
    .from('prestasi')
    .insert({
      santri_id,
      tahun_ajaran_id:      ta_id,
      kegiatan_sekolah:     kegiatan_sekolah     || '',
      kegiatan_pondok:      kegiatan_pondok       || '',
      prestasi_tahfidz:     prestasi_tahfidz      || [],
      prestasi_non_tahfidz: prestasi_non_tahfidz  || [],
      progres_pribadi:      progres_pribadi        || ''
    })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// PATCH — edit (musyrif & admin)
export async function PATCH(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID wajib' }, { status: 400 })

  const updates = await req.json()
  const allowed = ['kegiatan_sekolah','kegiatan_pondok',
                   'prestasi_tahfidz','prestasi_non_tahfidz','progres_pribadi']
  const clean = Object.fromEntries(
    Object.entries(updates).filter(([k]) => allowed.includes(k))
  )

  const { data, error } = await supabaseAdmin()
    .from('prestasi').update(clean).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE — admin saja
export async function DELETE(req: NextRequest) {
  if (!await isAdminFromRequest(req))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID wajib' }, { status: 400 })
  const { error } = await supabaseAdmin().from('prestasi').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
