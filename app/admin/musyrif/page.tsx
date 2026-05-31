'use client'
import { useEffect, useState } from 'react'

type Musyrif = { id: string; nama: string; no_hp: string; aktif: boolean }

function fmtHp(hp: string): string {
  if (!hp) return ''
  let clean = hp.replace(/\D/g, '')
  if (clean.startsWith('0')) clean = '62' + clean.slice(1)
  if (clean.startsWith('+62')) clean = clean.slice(1)
  return clean
}

export default function MusyrifPage() {
  const [list, setList]       = useState<Musyrif[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg]         = useState('')
  const [form, setForm]       = useState({ nama: '', no_hp: '' })
  const [editing, setEditing] = useState<Musyrif | null>(null)
  const [editForm, setEditForm] = useState({ nama: '', no_hp: '' })
  const [saving, setSaving]   = useState(false)

  const load = async () => {
    const r = await fetch('/api/musyrif')
    setList(await r.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  const tambah = async () => {
    if (!form.nama.trim()) { flash('Nama wajib diisi'); return }
    setSaving(true)
    const res = await fetch('/api/musyrif', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    if (res.ok) { flash('✓ Musyrif ditambahkan'); setForm({ nama: '', no_hp: '' }); load() }
    else { const d = await res.json(); flash('Error: ' + d.error) }
    setSaving(false)
  }

  const simpanEdit = async () => {
    if (!editing || !editForm.nama.trim()) return
    setSaving(true)
    const res = await fetch(`/api/musyrif?id=${editing.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editForm)
    })
    if (res.ok) { flash('✓ Disimpan'); setEditing(null); load() }
    else { const d = await res.json(); flash('Error: ' + d.error) }
    setSaving(false)
  }

  const hapus = async (m: Musyrif) => {
    if (!confirm(`Hapus ${m.nama}?\nMusyrif ini akan dilepas dari semua kelas yang diampu.`)) return
    const res = await fetch(`/api/musyrif?id=${m.id}`, { method: 'DELETE' })
    if (res.ok) { flash('✓ Dihapus'); load() }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Kelola Musyrif</h1>
          <p className="text-sm text-gray-400 mt-0.5">Data musyrif/musyrifah pondok</p>
        </div>
        {msg && (
          <span className={`text-sm font-medium ${msg.startsWith('Error') ? 'text-red-600' : 'text-emerald-600'}`}>
            {msg}
          </span>
        )}
      </div>

      {/* Form tambah */}
      <div className="card mb-6">
        <p className="text-sm font-medium mb-3">Tambah musyrif baru</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <div>
            <label className="label">Nama lengkap</label>
            <input className="input" placeholder="Ustadz / Ustadzah ..."
              value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && tambah()}/>
          </div>
          <div>
            <label className="label">No HP / WA</label>
            <input className="input" placeholder="08123456789"
              value={form.no_hp} onChange={e => setForm(f => ({ ...f, no_hp: e.target.value }))}
              onKeyDown={e => e.key === 'Enter' && tambah()}/>
          </div>
        </div>
        <button onClick={tambah} disabled={saving || !form.nama.trim()}
          className="btn btn-primary text-sm disabled:opacity-50">
          {saving ? 'Menyimpan...' : '+ Tambah Musyrif'}
        </button>
      </div>

      {/* Daftar */}
      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
          <span className="text-sm font-medium">Daftar Musyrif</span>
          <span className="text-xs text-gray-400">{list.length} musyrif</span>
        </div>
        {loading && <div className="py-8 text-center text-sm text-gray-400">Memuat...</div>}
        <ul className="divide-y divide-gray-50">
          {list.map(m => (
            <li key={m.id} className="px-4 py-3">
              {editing?.id === m.id ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input className="input text-sm py-1.5" placeholder="Nama"
                      value={editForm.nama} onChange={e => setEditForm(f => ({ ...f, nama: e.target.value }))}/>
                    <input className="input text-sm py-1.5" placeholder="No HP"
                      value={editForm.no_hp} onChange={e => setEditForm(f => ({ ...f, no_hp: e.target.value }))}/>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={simpanEdit} disabled={saving}
                      className="btn btn-primary text-xs py-1">{saving ? '...' : 'Simpan'}</button>
                    <button onClick={() => setEditing(null)} className="btn text-xs py-1">Batal</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-purple-50 text-purple-600 flex items-center
                                   justify-center text-sm font-bold flex-shrink-0">
                    {m.nama.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{m.nama}</p>
                    {m.no_hp ? (
                      <a href={`https://wa.me/${fmtHp(m.no_hp)}`} target="_blank" rel="noreferrer"
                        className="text-xs text-emerald-600 hover:underline">
                        📱 {m.no_hp}
                      </a>
                    ) : (
                      <p className="text-xs text-gray-400 italic">Belum ada no HP</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditing(m); setEditForm({ nama: m.nama, no_hp: m.no_hp }) }}
                      className="btn text-xs py-1">Edit</button>
                    <button onClick={() => hapus(m)}
                      className="btn btn-danger text-xs py-1">Hapus</button>
                  </div>
                </div>
              )}
            </li>
          ))}
          {!loading && list.length === 0 && (
            <li className="py-10 text-center text-sm text-gray-400">
              Belum ada musyrif. Tambahkan di atas.
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}
