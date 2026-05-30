import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { isAdminFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const kelas_id = req.nextUrl.searchParams.get('kelas_id')

  let query = supabase
    .from('santri')
    .select('*, kelas(nama)')
    .eq('aktif', true)
    .order('no_urut')

  if (kelas_id) query = query.eq('kelas_id', kelas_id)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' },
  })
}

export async function POST(req: NextRequest) {
  if (!await isAdminFromRequest(req))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const db = supabaseAdmin()

  // Bulk insert — pakai INSERT biasa bukan upsert agar tidak menimpa data
  if (body.bulk && Array.isArray(body.bulk)) {
    const rows = body.bulk
      .filter((r: any) => r.nama?.trim())
      .map((r: any, i: number) => ({
        kelas_id: body.kelas_id,
        nama: r.nama.trim(),
        no_urut: r.no_urut || i + 1,
        keterangan: r.keterangan || ''
      }))

    if (!rows.length)
      return NextResponse.json({ error: 'Tidak ada data valid' }, { status: 400 })

    // Untuk setiap row: update jika sudah ada (by id jika ada), insert jika belum
    // Simpan berdasarkan id yang dikirim (untuk edit), atau insert baru
    const toInsert = rows.filter((r: any) => !r.id)
    const toUpdate = rows.filter((r: any) => r.id)

    let inserted = 0
    let errors: string[] = []

    // Update yang sudah ada (by id)
    for (const r of toUpdate) {
      const { error } = await db.from('santri')
        .update({ nama: r.nama, no_urut: r.no_urut, keterangan: r.keterangan })
        .eq('id', r.id)
      if (error) errors.push(error.message)
    }

    // Insert yang baru
    if (toInsert.length > 0) {
      const { data, error } = await db.from('santri').insert(toInsert).select()
      if (error) errors.push(error.message)
      else inserted = data?.length || 0
    }

    if (errors.length) return NextResponse.json({ error: errors.join(', ') }, { status: 500 })
    return NextResponse.json({ inserted: inserted + toUpdate.length }, { status: 201 })
  }

  // Single insert
  const { kelas_id, nama, no_urut, keterangan } = body
  if (!kelas_id || !nama?.trim() || !no_urut)
    return NextResponse.json({ error: 'kelas_id, nama, no_urut wajib diisi' }, { status: 400 })

  const { data, error } = await db
    .from('santri')
    .insert({ kelas_id, nama: nama.trim(), no_urut, keterangan: keterangan || '' })
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  if (!await isAdminFromRequest(req))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 })

  const updates = await req.json()
  const allowed = ['nama', 'no_urut', 'kelas_id', 'keterangan', 'aktif']
  const clean = Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.includes(k)))

  const { data, error } = await supabaseAdmin()
    .from('santri').update(clean).eq('id', id).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest) {
  if (!await isAdminFromRequest(req))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 })

  // Soft delete
  const { error } = await supabaseAdmin()
    .from('santri').update({ aktif: false }).eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
