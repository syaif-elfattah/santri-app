import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

// GET /api/prestasi/achievement?kelas_id=xxx&tahun_ajaran_id=xxx
export async function GET(req: NextRequest) {
  const kelas_id        = req.nextUrl.searchParams.get('kelas_id')
  const tahun_ajaran_id = req.nextUrl.searchParams.get('tahun_ajaran_id')
  const santri_id       = req.nextUrl.searchParams.get('santri_id')

  // Kalau tidak ada TA, ambil yang aktif
  let ta_id = tahun_ajaran_id
  if (!ta_id) {
    const { data: ta } = await supabaseAdmin()
      .from('tahun_ajaran').select('id').eq('aktif', true).single()
    ta_id = ta?.id || null
  }

  if (santri_id) {
    const { data: santri } = await supabaseAdmin()
      .from('santri').select('*, kelas(nama)').eq('id', santri_id).single()

    let q = supabaseAdmin()
      .from('prestasi').select('*').eq('santri_id', santri_id)
      .order('created_at', { ascending: false })
    if (ta_id) q = q.eq('tahun_ajaran_id', ta_id)

    const { data: prestasi } = await q.limit(1).maybeSingle()
    return NextResponse.json({ santri, prestasi })
  }

  if (kelas_id) {
    const { data: santriList } = await supabaseAdmin()
      .from('santri')
      .select('*, kelas(nama)')
      .eq('kelas_id', kelas_id)
      .eq('aktif', true)
      .order('no_urut')

    const results = await Promise.all(
      (santriList || []).map(async (s: any) => {
        let q = supabaseAdmin()
          .from('prestasi').select('*').eq('santri_id', s.id)
          .order('created_at', { ascending: false })
        if (ta_id) q = q.eq('tahun_ajaran_id', ta_id)

        const { data: prestasi } = await q.limit(1).maybeSingle()
        return { santri: s, prestasi: prestasi || null }
      })
    )
    return NextResponse.json(results)
  }

  return NextResponse.json({ error: 'kelas_id atau santri_id wajib' }, { status: 400 })
}
