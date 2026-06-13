import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { isAdminFromRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const kelas_id = req.nextUrl.searchParams.get('kelas_id')
  let query = supabase
    .from('santri').select('*, kelas(nama)').eq('aktif', true).order('no_urut')
  if (kelas_id) query = query.eq('kelas_id', kelas_id)
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, {
  })
}

export async function POST(req: NextRequest) {
  if (!await isAdminFromRequest(req))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const db = supabaseAdmin()

  if (body.bulk && Array.isArray(body.bulk)) {
    const rows = body.bulk.filter((r: any) => r.nama?.trim())
    const toUpdate = rows.filter((r: any) => r.id)
    const toInsert = rows.filter((r: any) => !r.id)

    // Update yang sudah ada (by id) - langsung update, no conflict
    for (const r of toUpdate) {
      await db.from('santri')
        .update({ nama: r.nama.trim(), no_urut: r.no_urut, keterangan: r.keterangan || '' })
        .eq('id', r.id)
    }

    // Insert yang baru
    if (toInsert.length > 0) {
      const insertRows = toInsert.map((r: any) => ({
        kelas_id: body.kelas_id,
        nama: r.nama.trim(),
        no_urut: r.no_urut,
        keterangan: r.keterangan || ''
      }))
      const { error } = await db.from('santri').insert(insertRows)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ inserted: rows.length }, { status: 201 })
  }

  // Single insert
  const { kelas_id, nama, no_urut, keterangan } = body
  if (!kelas_id || !nama?.trim() || !no_urut)
    return NextResponse.json({ error: 'kelas_id, nama, no_urut wajib diisi' }, { status: 400 })

  const { data, error } = await db
    .from('santri').insert({ kelas_id, nama: nama.trim(), no_urut, keterangan: keterangan || '' })
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
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } })
}

export async function DELETE(req: NextRequest) {
  if (!await isAdminFromRequest(req))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID wajib diisi' }, { status: 400 })

  const { error } = await supabaseAdmin()
    .from('santri').update({ aktif: false }).eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
