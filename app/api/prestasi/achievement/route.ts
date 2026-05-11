import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/prestasi/achievement?kelas_id=xxx
// Kembalikan data semua santri di kelas untuk di-render sebagai PDF
export async function GET(req: NextRequest) {
  const kelas_id = req.nextUrl.searchParams.get('kelas_id')
  const santri_id = req.nextUrl.searchParams.get('santri_id')

  if (santri_id) {
    const { data: santri } = await supabaseAdmin()
      .from('santri').select('*, kelas(nama)').eq('id', santri_id).single()
    const { data: prestasi } = await supabaseAdmin()
      .from('prestasi').select('*').eq('santri_id', santri_id)
      .order('created_at', { ascending: false }).limit(1).single()
    return NextResponse.json({ santri, prestasi })
  }

  if (kelas_id) {
    const { data: santriList } = await supabaseAdmin()
      .from('santri').select('*, kelas(nama)').eq('kelas_id', kelas_id)
      .eq('aktif', true).order('no_urut')

    const results = await Promise.all(
      (santriList||[]).map(async (s: any) => {
        const { data: prestasi } = await supabaseAdmin()
          .from('prestasi').select('*').eq('santri_id', s.id)
          .order('created_at', { ascending: false }).limit(1).maybeSingle()
        return { santri: s, prestasi }
      })
    )
    return NextResponse.json(results)
  }

  return NextResponse.json({ error: 'kelas_id atau santri_id wajib' }, { status: 400 })
}
