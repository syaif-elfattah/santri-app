import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { isAdminFromRequest } from '@/lib/auth'

export async function GET() {
  const { data, error } = await supabase
    .from('achievement_config').select('*').eq('id', 1).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' }
  })
}

export async function PATCH(req: NextRequest) {
  if (!await isAdminFromRequest(req))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const allowed = [
    // teks
    'nama_institusi','judul','subjudul','label_diberikan',
    'teks_motivasi_1','teks_motivasi_2','teks_motivasi_3','label_motivasi',
    'teks_ayat','referensi_ayat',
    // warna kolom
    'warna_tahfidz','warna_non_tahfidz','warna_kegiatan','warna_progres',
    // warna teks
    'warna_judul','warna_inst','warna_subjudul','warna_label',
    'warna_nama','warna_kelas','warna_motivasi_title','warna_motivasi',
    'warna_ayat','warna_ayat_ref','warna_tanggal',
    // ukuran
    'ukuran_logo','ukuran_judul','ukuran_inst','ukuran_subjudul',
    'ukuran_label','ukuran_nama','ukuran_kelas','ukuran_hdr_kolom',
    'ukuran_sub_kolom','ukuran_isi','ukuran_total_label','ukuran_total_num',
    'ukuran_motivasi_title','ukuran_motivasi','ukuran_ayat','ukuran_tanggal',
    // bold
    'bold_judul','bold_inst','bold_subjudul','bold_label','bold_nama',
    'bold_kelas','bold_isi','bold_motivasi','bold_ayat','bold_tanggal',
    // tampil
    'tampil_progres','tampil_motivasi','tampil_ayat'
  ]
  const clean = Object.fromEntries(
    Object.entries(body).filter(([k]) => allowed.includes(k))
  )
  const { data, error } = await supabaseAdmin()
    .from('achievement_config').update(clean).eq('id', 1).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
