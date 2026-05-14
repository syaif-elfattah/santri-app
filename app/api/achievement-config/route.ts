import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { isAdminFromRequest } from '@/lib/auth'

// GET /api/achievement-config — publik (dibaca saat render achievement)
export async function GET() {
  const { data, error } = await supabase
    .from('achievement_config')
    .select('*')
    .eq('id', 1)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' }
  })
}

// PATCH /api/achievement-config — admin saja
export async function PATCH(req: NextRequest) {
  if (!await isAdminFromRequest(req))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const allowed = [
    'nama_institusi','judul','subjudul','label_diberikan',
    'teks_motivasi_1','teks_motivasi_2','teks_motivasi_3','label_motivasi',
    'teks_ayat','referensi_ayat',
    'warna_tahfidz','warna_non_tahfidz','warna_kegiatan','warna_progres',
    'ukuran_judul','ukuran_nama','ukuran_isi','ukuran_logo',
    'tampil_progres','tampil_motivasi','tampil_ayat'
  ]
  const clean = Object.fromEntries(
    Object.entries(body).filter(([k]) => allowed.includes(k))
  )

  const { data, error } = await supabaseAdmin()
    .from('achievement_config')
    .update(clean)
    .eq('id', 1)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
