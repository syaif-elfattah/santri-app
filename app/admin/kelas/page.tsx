'use client'
import { useEffect, useState } from 'react'

type Kelas   = { id: string; nama: string; urutan: number }
type Musyrif = { id: string; nama: string; no_hp: string }
type KelasMusyrif = { id: string; kelas_id: string; musyrif_id: string; musyrif: Musyrif }

export default function KelasPage() {
  const [list, setList]           = useState<Kelas[]>([])
  const [musyrifList, setMusyrifList] = useState<Musyrif[]>([])
  const [km, setKm]               = useState<KelasMusyrif[]>([])
  const [nama, setNama]           = useState('')
  const [loading, setLoading]     = useState(false)
  const [loadingAssign, setLoadingAssign] = useState<string | null>(null)
  const [msg, setMsg]             = useState('')
  const [expandKelas, setExpandKelas] = useState<string | null>(null)

  const load = async () => {
    const [k, m, kmData] = await Promise.all([
      fetch('/api/kelas').then(r => r.json()),
      fetch('/api/musyrif').then(r => r.json()),
      fetch('/api/kelas-musyrif').then(r => r.json()),
    ])
    setList(k); setMusyrifList(m); setKm(kmData)
  }

  useEffect(() => { load() }, [])

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  const tambah = async () => {
    if (!nama.trim()) return
    setLoading(true)
    const res = await fetch('/api/kelas', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nama: nama.trim(), urutan: list.length + 1 })
    })
    const d = await res.json()
    if (res.ok) { setNama(''); flash('✓ Kelas ditambahkan'); load() }
    else flash('Error: ' + d.error)
    setLoading(false)
  }

  const hapusKelas = async (id: string, namaKelas: string) => {
    if (!confirm(`Hapus ${namaKelas}? Semua data santri di kelas ini juga akan terhapus.`)) return
    const res = await fetch(`/api/kelas?id=${id}`, { method: 'DELETE' })
    if (res.ok) { flash('✓ Kelas dihapus'); load() }
  }

  const assignMusyrif = async (kelas_id: string, musyrif_id: string) => {
    if (!musyrif_id) return
    const sudah = km.find(x => x.kelas_id === kelas_id && x.musyrif_id === musyrif_id)
    if (sudah) { flash('Musyrif ini sudah ditambahkan di kelas ini'); return }
    setLoadingAssign(kelas_id)
    const res = await fetch('/api/kelas-musyrif', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kelas_id, musyrif_id })
    })
    if (res.ok) { flash('✓ Musyrif ditambahkan ke kelas'); await load() }
    else { const d = await res.json(); flash('Error: ' + d.error) }
    setLoadingAssign(null)
  }

  const unassign = async (id: string, kelas_id: string) => {
    setLoadingAssign(kelas_id)
    const res = await fetch(`/api/kelas-musyrif?id=${id}`, { method: 'DELETE' })
    if (res.ok) { flash('✓ Musyrif dilepas dari kelas'); await load() }
    setLoadingAssign(null)
  }

  const musyrifKelas = (kelas_id: string) => km.filter(x => x.kelas_id === kelas_id)
  const musyrifBelum = (kelas_id: string) => musyrifList.filter(
    m => !km.find(x => x.kelas_id === kelas_id && x.musyrif_id === m.id)
  )

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Kelola Kelas</h1>
          <p className="text-sm text-gray-400 mt-0.5">Tambah kelas & assign musyrif pengampu</p>
        </div>
        {msg && (
          <span className={`text-sm font-medium ${msg.startsWith('Error') ? 'text-red-600' : 'text-emerald-600'}`}>
            {msg}
          </span>
        )}
      </div>

      {/* Form tambah */}
      <div className="card mb-6">
        <p className="text-sm font-medium mb-3">Tambah kelas baru</p>
        <div className="flex gap-2">
          <input className="input flex-1" placeholder="Contoh: Kelas 8A"
            value={nama} onChange={e => setNama(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && tambah()}/>
          <button onClick={tambah} disabled={loading || !nama.trim()} className="btn btn-primary">
            {loading ? '...' : '+ Tambah'}
          </button>
        </div>
      </div>

      {/* Daftar kelas */}
      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <span className="text-sm font-medium">Daftar Kelas & Musyrif</span>
          <span className="text-xs text-gray-400">{list.length} kelas</span>
        </div>
        <ul className="divide-y divide-gray-50">
          {list.map(k => {
            const mk = musyrifKelas(k.id)
            const mb = musyrifBelum(k.id)
            const isOpen = expandKelas === k.id

            return (
              <li key={k.id}>
                {/* Row kelas */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className="w-7 h-7 bg-purple-50 text-purple-600 rounded-lg flex items-center
                                    justify-center text-xs font-medium flex-shrink-0">{k.urutan}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{k.nama}</p>
                    {mk.length > 0 ? (
                      <p className="text-xs text-gray-400">
                        {mk.map(m => m.musyrif.nama).join(' · ')}
                      </p>
                    ) : (
                      <p className="text-xs text-amber-500">Belum ada musyrif</p>
                    )}
                  </div>
                  <button onClick={() => setExpandKelas(isOpen ? null : k.id)}
                    className="btn text-xs py-1 text-purple-600 border-purple-200 hover:bg-purple-50">
                    👤 {isOpen ? 'Tutup' : 'Atur Musyrif'}
                  </button>
                  <button onClick={() => hapusKelas(k.id, k.nama)}
                    className="btn btn-danger text-xs py-1">Hapus</button>
                </div>

                {/* Panel assign musyrif */}
                {isOpen && (
                  <div className="px-4 pb-4 bg-gray-50/50 border-t border-gray-100">
                    {/* Musyrif yang sudah diassign */}
                    {mk.length > 0 && (
                      <div className="mt-3 mb-3">
                        <p className="text-xs font-medium text-gray-500 mb-2">Musyrif pengampu:</p>
                        <div className="flex flex-wrap gap-2">
                          {mk.map(m => (
                            <div key={m.id} className="flex items-center gap-1.5 bg-white border
                                                        border-purple-200 rounded-full pl-3 pr-1 py-1">
                              <span className="text-xs font-medium text-purple-700">{m.musyrif.nama}</span>
                              {m.musyrif.no_hp && (
                                <span className="text-xs text-gray-400">· {m.musyrif.no_hp}</span>
                              )}
                              <button onClick={() => unassign(m.id, k.id)}
                                className="w-5 h-5 rounded-full bg-red-50 text-red-400 hover:bg-red-100
                                           flex items-center justify-center text-xs ml-1">×</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tambah musyrif */}
                    {loadingAssign === k.id ? (
                      <div className="mt-2 flex items-center gap-2 text-gray-400 text-xs py-1">
                        <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                        </svg>
                        Menyimpan...
                      </div>
                    ) : mb.length > 0 ? (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-gray-500 mb-2">Tambah musyrif:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {mb.map(m => (
                            <button key={m.id} onClick={() => assignMusyrif(k.id, m.id)}
                              className="text-xs px-3 py-1.5 rounded-full border border-dashed
                                         border-purple-300 text-purple-600 hover:bg-purple-50 transition-colors">
                              + {m.nama}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : musyrifList.length === 0 ? (
                      <p className="text-xs text-gray-400 mt-2 italic">
                        Belum ada data musyrif. Tambahkan di menu Musyrif.
                      </p>
                    ) : (
                      <p className="text-xs text-emerald-600 mt-2">
                        ✓ Semua musyrif sudah diassign ke kelas ini.
                      </p>
                    )}
                  </div>
                )}
              </li>
            )
          })}
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
