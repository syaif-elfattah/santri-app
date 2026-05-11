import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { supabaseAdmin } from '@/lib/supabase'
import { isAdminFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  if (!await isAdminFromRequest(req))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabaseAdmin()
    .from('prestasi')
    .select(`id, kegiatan_sekolah, kegiatan_pondok, prestasi_tahfidz, prestasi_non_tahfidz, progres_pribadi, updated_at, santri(no_urut, nama, kelas(nama))`)
    .order('updated_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const JUZ_LEVEL: Record<number,string> = { 1:'Full', 2:'3/4', 3:'1/2', 4:'1/4' }

  const rows = (data||[]).map((p: any) => {
    const tahfidz = (p.prestasi_tahfidz||[])
      .map((j: any) => `Juz ${j.juz} (${JUZ_LEVEL[j.level]||''})`)
      .join(', ')
    const nonTahfidz = (p.prestasi_non_tahfidz||[])
      .map((n: any) => `${n.juara} – ${n.cabang} (${n.penyelenggara}, ${n.bulan_tahun})`)
      .join('\n')
    return {
      'No':                p.santri?.no_urut||'',
      'Nama':              p.santri?.nama||'',
      'Kelas':             p.santri?.kelas?.nama||'',
      'Kegiatan Sekolah':  p.kegiatan_sekolah,
      'Kegiatan Pondok':   p.kegiatan_pondok,
      'Prestasi Tahfidz':  tahfidz,
      'Prestasi Non Tahfidz': nonTahfidz,
      'Progres Pribadi':   p.progres_pribadi,
      'Update':            new Date(p.updated_at).toLocaleDateString('id-ID')
    }
  })

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(rows)
  ws['!cols'] = [{wch:5},{wch:25},{wch:12},{wch:30},{wch:30},{wch:35},{wch:40},{wch:35},{wch:14}]
  XLSX.utils.book_append_sheet(wb, ws, 'Semua Kelas')

  const kelasList = [...new Set(rows.map(r => r['Kelas']))]
  kelasList.forEach(k => {
    const wr = rows.filter(r => r['Kelas'] === k)
    const ws2 = XLSX.utils.json_to_sheet(wr)
    ws2['!cols'] = [{wch:5},{wch:25},{wch:12},{wch:30},{wch:30},{wch:35},{wch:40},{wch:35},{wch:14}]
    XLSX.utils.book_append_sheet(wb, ws2, String(k).replace('Kelas ','Kls '))
  })

  const buf = XLSX.write(wb, { type:'buffer', bookType:'xlsx' })
  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="LPJ_Santri_${new Date().toISOString().slice(0,10)}.xlsx"`
    }
  })
}
