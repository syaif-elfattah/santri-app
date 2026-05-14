'use client'
import { useState } from 'react'
import useSWR from 'swr'
import { fetcher } from '@/lib/fetcher'

type Rekap = {
  id: string; nama: string; no_urut: number
  kelas: string; jumlah_entri: number; terakhir_update: string
}
type Kelas       = { id: string; nama: string }
type TahunAjaran = { id: string; nama: string; aktif: boolean }

export default function DashboardPage() {
  const [filterKelas, setFilterKelas] = useState('')

  const { data: rekap,  isLoading: loadRekap } = useSWR<Rekap[]>(
    '/api/prestasi', fetcher, { refreshInterval: 30_000 }
  )
  const { data: kelas } = useSWR<Kelas[]>('/api/kelas', fetcher)
  const { data: taList } = useSWR<TahunAjaran[]>('/api/tahun-ajaran', fetcher)

  const data      = rekap || []
  const kelasList = kelas || []
  const filtered  = filterKelas ? data.filter(d => d.kelas === filterKelas) : data

  const totalSantri = new Set(data.map(d => d.id)).size
  const totalEntri  = data.reduce((a, b) => a + (b.jumlah_entri || 0), 0)
  const denganData  = data.filter(d => d.jumlah_entri > 0).length
  const taAktif     = (taList || []).find(t => t.aktif)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Ringkasan data santri
            {taAktif && (
              <span className="ml-2 text-emerald-600 font-medium">· TA {taAktif.nama}</span>
            )}
          </p>
        </div>
        <a href="/api/prestasi/export" className="btn btn-primary text-sm">
          ⬇ Ekspor Excel LPJ
        </a>
      </div>

      {/* Statistik */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total santri',     value: totalSantri, icon: '👥' },
          { label: 'Sudah ada data',   value: denganData,  icon: '✅' },
          { label: 'Total entri data', value: totalEntri,  icon: '📝' },
        ].map(s => (
          <div key={s.label} className="card">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-semibold text-gray-900">
              {loadRekap
                ? <span className="animate-pulse bg-gray-200 rounded h-7 w-12 inline-block"/>
                : s.value}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter kelas */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button onClick={() => setFilterKelas('')}
          className={`tag-pill ${!filterKelas ? 'active' : ''}`}>
          Semua kelas
        </button>
        {kelasList.map(k => (
          <button key={k.id} onClick={() => setFilterKelas(k.nama)}
            className={`tag-pill ${filterKelas === k.nama ? 'active' : ''}`}>
            {k.nama}
          </button>
        ))}
      </div>

      {/* Tabel */}
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
              {loadRekap && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">Memuat...</td>
                </tr>
              )}
              {!loadRekap && filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">Belum ada data</td>
                </tr>
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
                          day: 'numeric', month: 'short', year: 'numeric'
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
