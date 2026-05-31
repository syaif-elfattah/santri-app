import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/monitoring?tahun_ajaran_id=xxx
// Return: per kelas — total santri, sudah isi, belum isi, nama musyrif
export async function GET(req: NextRequest) {
  let ta_id = req.nextUrl.searchParams.get('tahun_ajaran_id')

  // Ambil TA aktif kalau tidak ada parameter
  if (!ta_id) {
    const { data: ta } = await supabaseAdmin()
      .from('tahun_ajaran').select('id').eq('aktif', true).single()
    ta_id = ta?.id || null
  }

  // Ambil semua kelas
  const { data: kelasList, error: kelasErr } = await supabaseAdmin()
    .from('kelas').select('id, nama, urutan').order('urutan')
  if (kelasErr) return NextResponse.json({ error: kelasErr.message }, { status: 500 })

  // Ambil semua santri aktif
  const { data: santriList } = await supabaseAdmin()
    .from('santri').select('id, kelas_id, nama, no_urut').eq('aktif', true)

  // Ambil semua prestasi di TA ini
  const { data: prestasiList } = await supabaseAdmin()
    .from('prestasi').select('santri_id, tahun_ajaran_id')
    .eq('tahun_ajaran_id', ta_id || '')

  // Ambil semua relasi kelas-musyrif
  const { data: km } = await supabaseAdmin()
    .from('kelas_musyrif')
    .select('kelas_id, musyrif(id, nama, no_hp)')

  const prestasiSet = new Set((prestasiList || []).map((p: any) => p.santri_id))

  const result = (kelasList || []).map((k: any) => {
    const santriKelas = (santriList || []).filter((s: any) => s.kelas_id === k.id)
    const sudahIsi = santriKelas.filter(s => prestasiSet.has(s.id))
    const belumIsi = santriKelas.filter(s => !prestasiSet.has(s.id))
    const musyrifKelas = (km || [])
      .filter((m: any) => m.kelas_id === k.id)
      .map((m: any) => m.musyrif)

    return {
      kelas_id:    k.id,
      kelas_nama:  k.nama,
      kelas_urutan:k.urutan,
      total:       santriKelas.length,
      sudah:       sudahIsi.length,
      belum:       belumIsi.length,
      belum_list:  belumIsi.sort((a,b) => a.no_urut - b.no_urut).map(s => s.nama),
      musyrif:     musyrifKelas,
      status:      belumIsi.length === 0 && santriKelas.length > 0
                   ? 'lengkap'
                   : sudahIsi.length > 0 ? 'sebagian' : 'kosong'
    }
  })

  return NextResponse.json(result)
}
