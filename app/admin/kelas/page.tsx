'use client'
import { useEffect, useState } from 'react'

type Kelas = { id: string; nama: string; urutan: number }

export default function KelasPage() {
  const [list, setList] = useState<Kelas[]>([])
  const [nama, setNama] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const load = () =>
    fetch('/api/kelas').then(r => r.json()).then(setList)

  useEffect(() => { load() }, [])

  const tambah = async () => {
    if (!nama.trim()) return
    setLoading(true)
    const res = await fetch('/api/kelas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama: nama.trim(), urutan: list.length + 1 })
    })
    const d = await res.json()
    if (res.ok) { setNama(''); setMsg('Kelas ditambahkan'); load() }
    else setMsg(d.error)
    setLoading(false)
    setTimeout(() => setMsg(''), 3000)
  }

  const hapus = async (id: string, namaKelas: string) => {
    if (!confirm(`Hapus ${namaKelas}? Semua data santri di kelas ini juga akan terhapus.`)) return
    const res = await fetch(`/api/kelas?id=${id}`, { method: 'DELETE' })
    if (res.ok) { setMsg('Kelas dihapus'); load() }
    setTimeout(() => setMsg(''), 3000)
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold mb-1">Kelola Kelas</h1>
      <p className="text-sm text-gray-400 mb-6">Tambah atau hapus kelas. Kelas tidak bisa diubah namanya.</p>

      {/* Form tambah */}
      <div className="card mb-6">
        <p className="text-sm font-medium mb-3">Tambah kelas baru</p>
        <div className="flex gap-2">
          <input className="input flex-1" placeholder="Contoh: Kelas 8A"
            value={nama} onChange={e => setNama(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && tambah()} />
          <button onClick={tambah} disabled={loading || !nama.trim()}
            className="btn btn-primary whitespace-nowrap">
            {loading ? '...' : '+ Tambah'}
          </button>
        </div>
        {msg && <p className={`text-xs mt-2 ${msg.includes('Hapus') || msg.includes('error') ? 'text-red-500' : 'text-emerald-600'}`}>{msg}</p>}
      </div>

      {/* Daftar kelas */}
      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <span className="text-sm font-medium">Daftar kelas</span>
          <span className="text-xs text-gray-400">{list.length} kelas</span>
        </div>
        <ul className="divide-y divide-gray-50">
          {list.map(k => (
            <li key={k.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 bg-purple-50 text-purple-600 rounded-lg
                                  flex items-center justify-center text-xs font-medium">
                  {k.urutan}
                </span>
                <span className="text-sm font-medium text-gray-800">{k.nama}</span>
              </div>
              <button onClick={() => hapus(k.id, k.nama)}
                className="btn btn-danger text-xs">Hapus</button>
            </li>
          ))}
          {list.length === 0 && (
            <li className="py-8 text-center text-sm text-gray-400">
              Belum ada kelas. Tambahkan kelas dulu.
            </li>
          )}
        </ul>
      </div>
    </div>
  )
}
