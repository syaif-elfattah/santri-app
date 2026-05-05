'use client'
import { useEffect, useState } from 'react'

type Rekap = {
  id: string; nama: string; no_urut: number
  kelas: string; jumlah_entri: number; terakhir_update: string
}

export default function DashboardPage() {
  const [data, setData] = useState<Rekap[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [kelasList, setKelasList] = useState<string[]>([])

  useEffect(() => {
    Promise.all([
      fetch('/api/prestasi').then(r => r.json()),
      fetch('/api/kelas').then(r => r.json())
    ]).then(([rekap, kelas]) => {
      setData(rekap)
      setKelasList(kelas.map((k: any) => k.nama))
      setLoading(false)
    })
  }, [])

  const filtered = filter ? data.filter(d => d.kelas === filter) : data
  const totalSantri = new Set(data.map(d => d.id)).size
  const totalEntri = data.reduce((a, b) => a + (b.jumlah_entri || 0), 0)
  const denganData = data.filter(d => d.jumlah_entri > 0).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">Ringkasan data semua santri</p>
        </div>
        <a href="/api/prestasi/export"
          className="btn btn-primary text-sm">
          ⬇ Ekspor Excel LPJ
        </a>
      </div>

      {/* Statistik */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total santri', value: totalSantri, icon: '👥' },
          { label: 'Sudah ada data', value: denganData, icon: '✅' },
          { label: 'Total entri data', value: totalEntri, icon: '📝' },
        ].map(s => (
          <div key={s.label} className="card">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-semibold text-gray-900">{s.value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter kelas */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button onClick={() => setFilter('')}
          className={`tag-pill ${!filter ? 'active' : ''}`}>Semua kelas</button>
        {kelasList.map(k => (
          <button key={k} onClick={() => setFilter(k)}
            className={`tag-pill ${filter === k ? 'active' : ''}`}>{k}</button>
        ))}
      </div>

      {/* Tabel rekap */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">No</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Nama Santri</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Kelas</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Jumlah Data</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Update Terakhir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading && (
                <tr><td colSpan={5} className="py-12 text-center text-gray-400">Memuat...</td></tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr><td colSpan={5} className="py-12 text-center text-gray-400">Belum ada data</td></tr>
              )}
              {filtered.map((d, i) => (
                <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{d.nama}</td>
                  <td className="px-4 py-3">
                    <span className="bg-purple-50 text-purple-600 text-xs px-2 py-0.5 rounded-full">
                      {d.kelas}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full
                      ${d.jumlah_entri > 0
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-gray-100 text-gray-400'}`}>
                      {d.jumlah_entri || 0} entri
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {d.terakhir_update
                      ? new Date(d.terakhir_update).toLocaleDateString('id-ID', {
                          day:'numeric', month:'short', year:'numeric'
                        })
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
