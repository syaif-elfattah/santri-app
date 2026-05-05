import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { isAdminFromRequest } from '@/lib/auth'

// GET /api/prestasi?santri_id=xxx
export async function GET(req: NextRequest) {
  const santri_id = req.nextUrl.searchParams.get('santri_id')
  const kelas_id  = req.nextUrl.searchParams.get('kelas_id')

  if (santri_id) {
    const { data, error } = await supabase
      .from('prestasi')
      .select('*')
      .eq('santri_id', santri_id)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  // Rekap per kelas (admin dashboard)
  if (kelas_id) {
    const { data, error } = await supabase
      .from('rekap_santri')
      .select('*')
      .eq('kelas', kelas_id)   // view join kelas.nama

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  // Semua rekap (admin)
  const { data, error } = await supabase
    .from('rekap_santri')
    .select('*')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/prestasi - input baru (musyrif - TANPA LOGIN)
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { santri_id, kegiatan_sekolah, kegiatan_pondok,
          prestasi_sekolah, prestasi_pondok, progres_pribadi } = body

  if (!santri_id)
    return NextResponse.json({ error: 'santri_id wajib diisi' }, { status: 400 })

  // Musyrif tidak perlu login — tulis pakai service role
  const { data, error } = await supabaseAdmin()
    .from('prestasi')
    .insert({
      santri_id,
      kegiatan_sekolah: kegiatan_sekolah || '',
      kegiatan_pondok:  kegiatan_pondok  || '',
      prestasi_sekolah: prestasi_sekolah || '',
      prestasi_pondok:  prestasi_pondok  || '',
      progres_pribadi:  progres_pribadi  || ''
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

// PATCH /api/prestasi?id=xxx - edit (musyrif bisa edit miliknya, admin bebas)
export async function PATCH(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 })

  const updates = await req.json()
  const allowed = ['kegiatan_sekolah','kegiatan_pondok',
                   'prestasi_sekolah','prestasi_pondok','progres_pribadi']
  const clean = Object.fromEntries(
    Object.entries(updates).filter(([k]) => allowed.includes(k))
  )

  const { data, error } = await supabaseAdmin()
    .from('prestasi').update(clean).eq('id', id).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/prestasi?id=xxx (admin saja)
export async function DELETE(req: NextRequest) {
  if (!await isAdminFromRequest(req))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 })

  const { error } = await supabaseAdmin().from('prestasi').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
