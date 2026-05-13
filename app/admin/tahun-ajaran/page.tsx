'use client'
import { useEffect, useState } from 'react'

type TA = {
  id: string; nama: string
  tanggal_mulai: string; tanggal_selesai: string
  aktif: boolean; created_at: string
}

export default function TahunAjaranPage() {
  const [list, setList]       = useState<TA[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg]         = useState('')
  const [form, setForm]       = useState({ nama:'', tanggal_mulai:'', tanggal_selesai:'' })
  const [saving, setSaving]   = useState(false)

  const load = async () => {
    const r = await fetch('/api/tahun-ajaran')
    setList(await r.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  const tambah = async () => {
    if (!form.nama || !form.tanggal_mulai || !form.tanggal_selesai) {
      flash('Semua field wajib diisi'); return
    }
    setSaving(true)
    const res = await fetch('/api/tahun-ajaran', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const d = await res.json()
    if (res.ok) { flash('✓ Tahun ajaran ditambahkan'); setForm({ nama:'', tanggal_mulai:'', tanggal_selesai:'' }); load() }
    else flash('Error: ' + d.error)
    setSaving(false)
  }

  const setAktif = async (id: string) => {
    const res = await fetch(`/api/tahun-ajaran?id=${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ aktif: true })
    })
    if (res.ok) { flash('✓ Tahun ajaran aktif diubah'); load() }
  }

  const hapus = async (id: string, nama: string) => {
    if (!confirm(`Hapus tahun ajaran "${nama}"?\nData prestasi yang terhubung akan kehilangan referensi TA.`)) return
    const res = await fetch(`/api/tahun-ajaran?id=${id}`, { method: 'DELETE' })
    const d = await res.json()
    if (res.ok) { flash('✓ Dihapus'); load() }
    else flash('Error: ' + d.error)
  }

  const fmt = (d: string) => new Date(d).toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' })

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Tahun Ajaran</h1>
          <p className="text-sm text-gray-400 mt-0.5">Kelola tahun ajaran · hanya 1 yang aktif</p>
        </div>
        {msg && <span className={`text-sm font-medium ${msg.startsWith('Error') ? 'text-red-600' : 'text-emerald-600'}`}>{msg}</span>}
      </div>

      {/* Form tambah */}
      <div className="card mb-6">
        <p className="text-sm font-medium mb-4">Tambah tahun ajaran baru</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
          <div>
            <label className="label">Nama (contoh: 2026/2027)</label>
            <input className="input" placeholder="2026/2027"
              value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))}/>
          </div>
          <div>
            <label className="label">Tanggal Mulai</label>
            <input className="input" type="date"
              value={form.tanggal_mulai} onChange={e => setForm(f => ({ ...f, tanggal_mulai: e.target.value }))}/>
          </div>
          <div>
            <label className="label">Tanggal Selesai</label>
            <input className="input" type="date"
              value={form.tanggal_selesai} onChange={e => setForm(f => ({ ...f, tanggal_selesai: e.target.value }))}/>
          </div>
        </div>
        <button onClick={tambah} disabled={saving} className="btn btn-primary text-sm">
          {saving ? 'Menyimpan...' : '+ Tambah'}
        </button>
      </div>

      {/* Daftar */}
      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <span className="text-sm font-medium">Daftar Tahun Ajaran</span>
          <span className="text-xs text-gray-400">{list.length} tahun ajaran</span>
        </div>
        {loading && <div className="py-8 text-center text-sm text-gray-400">Memuat...</div>}
        <ul className="divide-y divide-gray-50">
          {list.map(ta => (
            <li key={ta.id} className="px-4 py-3 flex items-center gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-800">{ta.nama}</span>
                  {ta.aktif && (
                    <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                      ✓ Aktif
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {fmt(ta.tanggal_mulai)} — {fmt(ta.tanggal_selesai)}
                </p>
              </div>
              <div className="flex gap-2">
                {!ta.aktif && (
                  <button onClick={() => setAktif(ta.id)}
                    className="btn text-xs py-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                    Set Aktif
                  </button>
                )}
                {!ta.aktif && (
                  <button onClick={() => hapus(ta.id, ta.nama)}
                    className="btn btn-danger text-xs py-1">Hapus</button>
                )}
              </div>
            </li>
          ))}
          {!loading && list.length === 0 && (
            <li className="py-8 text-center text-sm text-gray-400">Belum ada tahun ajaran</li>
          )}
        </ul>
      </div>

      {/* Penjelasan */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-blue-800 mb-2">📋 Cara kerja sistem tahun ajaran</p>
        <ul className="text-xs text-blue-700 space-y-1.5">
          <li>• Hanya <strong>1 tahun ajaran aktif</strong> dalam satu waktu. Saat ganti tahun ajaran, klik "Set Aktif" pada tahun ajaran baru.</li>
          <li>• Semua <strong>input prestasi baru</strong> otomatis masuk ke tahun ajaran yang sedang aktif.</li>
          <li>• <strong>Data lama tetap tersimpan</strong> dan bisa dilihat dengan memfilter tahun ajaran di halaman Prestasi & Achievement.</li>
          <li>• <strong>Achievement</strong> menampilkan data prestasi sesuai tahun ajaran yang dipilih — 1 santri maksimal 1 entri per tahun ajaran.</li>
          <li>• <strong>Data yang sudah ada</strong> secara otomatis tergolong ke tahun ajaran 2025/2026 (dijalankan saat migration SQL).</li>
        </ul>
      </div>
    </div>
  )
}
