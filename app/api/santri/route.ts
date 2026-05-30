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
    headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' },
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

    const errors: string[] = []

    // 1. Update yang sudah ada (by id) — no conflict
    for (const r of toUpdate) {
      const { error } = await db.from('santri')
        .update({ nama: r.nama.trim(), no_urut: r.no_urut, keterangan: r.keterangan || '' })
        .eq('id', r.id)
      if (error) errors.push(error.message)
    }

    // 2. Insert yang baru — kalau no_urut tabrakan, geser dulu ke no sementara besar
    if (toInsert.length > 0) {
      // Ambil max no_urut yang ada di kelas ini
      const { data: existing } = await db
        .from('santri').select('no_urut').eq('kelas_id', body.kelas_id).eq('aktif', true)
      const usedNos = new Set((existing || []).map((s: any) => s.no_urut))

      // Assign no_urut yang aman (tidak tabrakan)
      let counter = 1
      const safeInsert = toInsert.map((r: any) => {
        // Pakai no_urut dari draft jika tidak tabrakan, kalau tabrakan cari yang kosong
        let no = r.no_urut
        if (usedNos.has(no)) {
          // Cari no_urut yang belum dipakai
          while (usedNos.has(counter)) counter++
          no = counter
          counter++
        }
        usedNos.add(no)
        return {
          kelas_id: body.kelas_id,
          nama: r.nama.trim(),
          no_urut: no,
          keterangan: r.keterangan || ''
        }
      })

      const { error } = await db.from('santri').insert(safeInsert)
      if (error) errors.push(error.message)
    }

    if (errors.length)
      return NextResponse.json({ error: errors.join(', ') }, { status: 500 })

    return NextResponse.json({ inserted: rows.length }, { status: 201 })
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

  const { error } = await supabaseAdmin()
    .from('santri').update({ aktif: false }).eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
