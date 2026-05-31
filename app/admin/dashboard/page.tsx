'use client'
import { useState, useEffect } from 'react'

type Rekap = {
  id: string; nama: string; no_urut: number
  kelas: string; jumlah_entri: number; terakhir_update: string
}
type Kelas       = { id: string; nama: string }
type TahunAjaran = { id: string; nama: string; aktif: boolean }
type Musyrif     = { id: string; nama: string; no_hp: string }
type MonitorKelas = {
  kelas_id: string; kelas_nama: string; kelas_urutan: number
  total: number; sudah: number; belum: number
  belum_list: string[]; musyrif: Musyrif[]; status: 'lengkap'|'sebagian'|'kosong'
}

function fmtHp(hp: string): string {
  if (!hp) return ''
  let c = hp.replace(/\D/g, '')
  if (c.startsWith('0')) c = '62' + c.slice(1)
  return c
}

function buatPesanWA(m: MonitorKelas, musyrif: Musyrif, taName: string): string {
  const belumTeks = m.belum_list.map(n => `• ${n}`).join('\n')
  return encodeURIComponent(
`Assalamu'alaikum warahmatullahi wabarakatuh

Ustadz/Ustadzah ${musyrif.nama} yang kami hormati,

Bersama ini kami sampaikan bahwa pengisian data E-Prestasi Santri ${m.kelas_nama} Tahun Ajaran ${taName} saat ini baru terisi ${m.sudah} dari ${m.total} santri.

Berikut santri yang datanya belum lengkap:
${belumTeks}

Mohon kiranya Ustadz/Ustadzah berkenan meluangkan waktu untuk melengkapi data tersebut melalui:
santri-app-eta.vercel.app

Atas perhatian dan kerja samanya, kami ucapkan jazakumullahu khairan.

Wassalamu'alaikum warahmatullahi wabarakatuh

TU Pondok
Pondok Pesantren Ma'ahid Kudus`
  )
}

export default function DashboardPage() {
  const [tab, setTab]           = useState<'santri'|'monitoring'>('monitoring')
  const [filterKelas, setFilterKelas] = useState('')
  const [rekap,   setRekap]     = useState<Rekap[]>([])
  const [kelas,   setKelas]     = useState<Kelas[]>([])
  const [taList,  setTaList]    = useState<TahunAjaran[]>([])
  const [monitor, setMonitor]   = useState<MonitorKelas[]>([])
  const [loading, setLoading]   = useState(true)
  const [waModal, setWaModal]   = useState<MonitorKelas | null>(null)
  const [expandBelum, setExpandBelum] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch('/api/prestasi').then(r => r.json()),
      fetch('/api/kelas').then(r => r.json()),
      fetch('/api/tahun-ajaran').then(r => r.json()),
      fetch('/api/monitoring').then(r => r.json()),
    ]).then(([r, k, t, mon]) => {
      setRekap(Array.isArray(r) ? r : [])
      setKelas(Array.isArray(k) ? k : [])
      setTaList(Array.isArray(t) ? t : [])
      setMonitor(Array.isArray(mon) ? mon : [])
      setLoading(false)
    })
  }, [])

  const taAktif    = taList.find(t => t.aktif)
  const data       = rekap || []
  const kelasList  = kelas || []
  const filtered   = filterKelas ? data.filter(d => d.kelas === filterKelas) : data
  const totalSantri= new Set(data.map(d => d.id)).size
  const denganData = data.filter(d => d.jumlah_entri > 0).length
  const totalEntri = data.reduce((a, b) => a + (b.jumlah_entri || 0), 0)

  const statusBadge = (s: string) => ({
    lengkap:  'bg-emerald-100 text-emerald-700',
    sebagian: 'bg-amber-100 text-amber-700',
    kosong:   'bg-red-100 text-red-700',
  }[s] || 'bg-gray-100 text-gray-500')

  const statusLabel = (s: string) => ({
    lengkap:  '🟢 Lengkap',
    sebagian: '🟡 Sebagian',
    kosong:   '🔴 Belum ada',
  }[s] || '—')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {taAktif && <span className="text-emerald-600 font-medium">TA {taAktif.nama}</span>}
          </p>
        </div>
        <a href="/api/prestasi/export" className="btn btn-primary text-sm">⬇ Ekspor Excel</a>
      </div>

      {/* Statistik */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total santri',     value: totalSantri, icon: '👥' },
          { label: 'Sudah ada data',   value: denganData,  icon: '✅' },
          { label: 'Belum ada data',   value: totalSantri - denganData, icon: '⏳' },
          { label: 'Total entri',      value: totalEntri,  icon: '📝' },
        ].map(s => (
          <div key={s.label} className="card py-3">
            <div className="text-xl mb-1">{s.icon}</div>
            <div className="text-2xl font-semibold text-gray-900">
              {loading ? <span className="animate-pulse bg-gray-200 rounded h-7 w-10 inline-block"/> : s.value}
            </div>
            <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tab switch */}
      <div className="flex bg-gray-100 p-1 rounded-xl w-fit mb-5">
        <button onClick={() => setTab('monitoring')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all
            ${tab==='monitoring' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          📊 Monitoring Kelas
        </button>
        <button onClick={() => setTab('santri')}
          className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all
            ${tab==='santri' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          👥 Per Santri
        </button>
      </div>

      {/* TAB: Monitoring per kelas */}
      {tab === 'monitoring' && (
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <span className="text-sm font-medium">Status Pengisian per Kelas</span>
            <span className="text-xs text-gray-400">{monitor.length} kelas</span>
          </div>
          {loading && <div className="py-12 text-center text-gray-400 text-sm">Memuat...</div>}
          <div className="divide-y divide-gray-50">
            {monitor.map(m => (
              <div key={m.kelas_id}>
                <div className="flex items-center gap-3 px-4 py-3">
                  {/* Kelas & musyrif */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-800 text-sm">{m.kelas_nama}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(m.status)}`}>
                        {statusLabel(m.status)}
                      </span>
                    </div>
                    {m.musyrif.length > 0 ? (
                      <p className="text-xs text-gray-400 mt-0.5">
                        👤 {m.musyrif.map(mu => mu.nama).join(' · ')}
                      </p>
                    ) : (
                      <p className="text-xs text-amber-500 mt-0.5">⚠ Belum ada musyrif</p>
                    )}
                  </div>

                  {/* Progress */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-800">{m.sudah}/{m.total}</p>
                    <p className="text-xs text-gray-400">santri terisi</p>
                  </div>

                  {/* Progress bar */}
                  <div className="w-20 flex-shrink-0 hidden sm:block">
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-2 rounded-full transition-all ${
                        m.status==='lengkap' ? 'bg-emerald-500' :
                        m.status==='sebagian' ? 'bg-amber-400' : 'bg-red-300'
                      }`} style={{width: m.total > 0 ? `${(m.sudah/m.total)*100}%` : '0%'}}/>
                    </div>
                  </div>

                  {/* Tombol aksi */}
                  <div className="flex gap-1.5 flex-shrink-0">
                    {m.belum > 0 && (
                      <button onClick={() => setExpandBelum(expandBelum === m.kelas_id ? null : m.kelas_id)}
                        className="btn text-xs py-1 text-gray-500">
                        {expandBelum === m.kelas_id ? 'Tutup' : `${m.belum} belum`}
                      </button>
                    )}
                    {m.status !== 'lengkap' && m.musyrif.length > 0 && (
                      <button onClick={() => setWaModal(m)}
                        className="btn text-xs py-1 text-emerald-600 border-emerald-200 hover:bg-emerald-50">
                        📱 WA
                      </button>
                    )}
                  </div>
                </div>

                {/* Daftar santri belum isi */}
                {expandBelum === m.kelas_id && m.belum_list.length > 0 && (
                  <div className="px-4 pb-3 bg-red-50/50">
                    <p className="text-xs font-medium text-red-600 mb-1.5">Belum mengisi:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {m.belum_list.map((nama, i) => (
                        <span key={i} className="text-xs bg-white border border-red-200 text-red-600 px-2 py-0.5 rounded-full">
                          {nama}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: Per santri */}
      {tab === 'santri' && (
        <>
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <button onClick={() => setFilterKelas('')}
              className={`tag-pill ${!filterKelas ? 'active' : ''}`}>Semua</button>
            {kelasList.map(k => (
              <button key={k.id} onClick={() => setFilterKelas(k.nama)}
                className={`tag-pill ${filterKelas === k.nama ? 'active' : ''}`}>{k.nama}</button>
            ))}
          </div>
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">No</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Nama Santri</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Kelas</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500">Data</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Update Terakhir</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading && <tr><td colSpan={5} className="py-12 text-center text-gray-400">Memuat...</td></tr>}
                  {!loading && filtered.length === 0 && <tr><td colSpan={5} className="py-12 text-center text-gray-400">Belum ada data</td></tr>}
                  {filtered.map((d, i) => (
                    <tr key={d.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-400">{i+1}</td>
                      <td className="px-4 py-3 font-medium text-gray-800">{d.nama}</td>
                      <td className="px-4 py-3">
                        <span className="bg-purple-50 text-purple-600 text-xs px-2 py-0.5 rounded-full">{d.kelas}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full
                          ${d.jumlah_entri > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                          {d.jumlah_entri || 0} entri
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {d.terakhir_update ? new Date(d.terakhir_update).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'}) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Modal WA */}
      {waModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-1">Kirim Pesan WA</h3>
            <p className="text-sm text-gray-500 mb-4">{waModal.kelas_nama} · {waModal.belum} santri belum mengisi</p>
            <p className="text-xs font-medium text-gray-600 mb-2">Pilih musyrif:</p>
            <div className="space-y-2 mb-4">
              {waModal.musyrif.map(mu => (
                <div key={mu.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{mu.nama}</p>
                    {mu.no_hp
                      ? <p className="text-xs text-gray-400">{mu.no_hp}</p>
                      : <p className="text-xs text-red-400 italic">Belum ada no HP</p>
                    }
                  </div>
                  {mu.no_hp ? (
                    <a href={`https://wa.me/${fmtHp(mu.no_hp)}?text=${buatPesanWA(waModal, mu, taAktif?.nama || '2025/2026')}`}
                      target="_blank" rel="noreferrer"
                      onClick={() => setWaModal(null)}
                      className="btn btn-primary text-xs py-1.5">
                      📱 Kirim WA
                    </a>
                  ) : (
                    <span className="text-xs text-gray-400">Isi no HP dulu</span>
                  )}
                </div>
              ))}
            </div>
            <button onClick={() => setWaModal(null)} className="btn w-full text-sm">Tutup</button>
          </div>
        </div>
      )}
    </div>
  )
}
