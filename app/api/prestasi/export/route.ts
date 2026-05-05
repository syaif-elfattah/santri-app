import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { supabaseAdmin } from '@/lib/supabase'
import { isAdminFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  if (!await isAdminFromRequest(req))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const kelas_filter = req.nextUrl.searchParams.get('kelas') // opsional

  // Ambil semua data dengan join
  let query = supabaseAdmin()
    .from('prestasi')
    .select(`
      id,
      kegiatan_sekolah,
      kegiatan_pondok,
      prestasi_sekolah,
      prestasi_pondok,
      progres_pribadi,
      updated_at,
      santri (
        no_urut,
        nama,
        kelas ( nama )
      )
    `)
    .order('updated_at', { ascending: false })

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Flatten data
  let rows = (data || []).map((p: any) => ({
    'No Urut':           p.santri?.no_urut || '',
    'Nama Santri':       p.santri?.nama || '',
    'Kelas':             p.santri?.kelas?.nama || '',
    'Kegiatan Sekolah':  p.kegiatan_sekolah,
    'Kegiatan Pondok':   p.kegiatan_pondok,
    'Prestasi Sekolah':  p.prestasi_sekolah,
    'Prestasi Pondok':   p.prestasi_pondok,
    'Progres Pribadi':   p.progres_pribadi,
    'Terakhir Update':   new Date(p.updated_at).toLocaleDateString('id-ID')
  }))

  if (kelas_filter) {
    rows = rows.filter(r => r['Kelas'] === kelas_filter)
  }

  // Buat workbook dengan sheet per kelas
  const wb = XLSX.utils.book_new()

  // Sheet: Semua Kelas
  const ws_all = XLSX.utils.json_to_sheet(rows)
  ws_all['!cols'] = [
    {wch:8},{wch:25},{wch:12},{wch:30},{wch:30},{wch:30},{wch:30},{wch:35},{wch:16}
  ]
  XLSX.utils.book_append_sheet(wb, ws_all, 'Semua Kelas')

  // Sheet per kelas
  const kelasList = [...new Set(rows.map(r => r['Kelas']))]
  kelasList.forEach(k => {
    const kelasRows = rows.filter(r => r['Kelas'] === k)
    const ws = XLSX.utils.json_to_sheet(kelasRows)
    ws['!cols'] = [
      {wch:8},{wch:25},{wch:12},{wch:30},{wch:30},{wch:30},{wch:30},{wch:35},{wch:16}
    ]
    XLSX.utils.book_append_sheet(wb, ws, k.replace('Kelas ', 'Kls '))
  })

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="LPJ_Santri_${new Date().toISOString().slice(0,10)}.xlsx"`
    }
  })
}
