'use client'
import { useEffect, useState } from 'react'

type Kelas    = { id: string; nama: string }
type Santri   = { id: string; nama: string; no_urut: number }
type Prestasi = {
  id: string; santri_id: string
  kegiatan_sekolah: string; kegiatan_pondok: string
  prestasi_sekolah: string; prestasi_pondok: string
  progres_pribadi: string; updated_at: string
}
type SantriWithPrestasi = Santri & { prestasi: Prestasi[] }

const FIELD_LABELS: { key: keyof Prestasi; label: string; color: string }[] = [
  { key: 'kegiatan_sekolah', label: 'Kegiatan Sekolah', color: 'blue'    },
  { key: 'kegiatan_pondok',  label: 'Kegiatan Pondok',  color: 'purple'  },
  { key: 'prestasi_sekolah', label: 'Prestasi Sekolah', color: 'emerald' },
  { key: 'prestasi_pondok',  label: 'Prestasi Pondok',  color: 'amber'   },
  { key: 'progres_pribadi',  label: 'Progres Pribadi',  color: 'rose'    },
]

const COLOR_MAP: Record<string, string> = {
  blue:    'bg-blue-50 text-blue-700 border-blue-100',
  purple:  'bg-purple-50 text-purple-700 border-purple-100',
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  amber:   'bg-amber-50 text-amber-700 border-amber-100',
  rose:    'bg-rose-50 text-rose-700 border-rose-100',
}

export default function PrestasiAdminPage() {
  const [kelasList, setKelasList]       = useState<Kelas[]>([])
  const [activeKelas, setActiveKelas]   = useState<Kelas | null>(null)
  const [santriData, setSantriData]     = useState<SantriWithPrestasi[]>([])
  const [loading, setLoading]           = useState(false)
  const [editing, setEditing]           = useState<Prestasi | null>(null)
  const [editForm, setEditForm]         = useState<Partial<Prestasi>>({})
  const [saving, setSaving]             = useState(false)
  const [msg, setMsg]                   = useState('')
  const [expandedSantri, setExpanded]   = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/kelas').then(r => r.json()).then((k: Kelas[]) => {
      setKelasList(k)
      if (k.length) selectKelas(k[0])
    })
  }, [])

  const selectKelas = async (k: Kelas) => {
    setActiveKelas(k)
    setLoading(true)
    setEditing(null)
    try {
      // Ambil semua santri kelas ini
      const sr = await fetch(`/api/santri?kelas_id=${k.id}`)
      const santriList: Santri[] = await sr.json()

      // Ambil prestasi tiap santri secara paralel
      const withPrestasi = await Promise.all(
        santriList.map(async s => {
          const pr = await fetch(`/api/prestasi?santri_id=${s.id}`)
          const prestasi: Prestasi[] = await pr.json()
          return { ...s, prestasi }
        })
      )
      setSantriData(withPrestasi)
      // Expand semua santri by default
      setExpanded(new Set(santriList.map(s => s.id)))
    } finally {
      setLoading(false)
    }
  }

  const toggleExpand = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const startEdit = (p: Prestasi) => {
    setEditing(p)
    setEditForm({ ...p })
  }

  const saveEdit = async () => {
    if (!editing || !activeKelas) return
    setSaving(true)
    const { id, kegiatan_sekolah, kegiatan_pondok,
            prestasi_sekolah, prestasi_pondok, progres_pribadi } = editForm as Prestasi
    const res = await fetch(`/api/prestasi?id=${editing.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kegiatan_sekolah, kegiatan_pondok,
                             prestasi_sekolah, prestasi_pondok, progres_pribadi })
    })
    if (res.ok) {
      setEditing(null)
      setMsg('✓ Data disimpan')
      await selectKelas(activeKelas)
    }
    setSaving(false)
    setTimeout(() => setMsg(''), 2000)
  }

  const hapusEntry = async (prestasiId: string) => {
    if (!confirm('Hapus entri ini?') || !activeKelas) return
    await fetch(`/api/prestasi?id=${prestasiId}`, { method: 'DELETE' })
    setMsg('✓ Entri dihapus')
    await selectKelas(activeKelas)
    setTimeout(() => setMsg(''), 2000)
  }

  const totalEntri = santriData.reduce((a, s) => a + s.prestasi.length, 0)
  const sudahIsi   = santriData.filter(s => s.prestasi.length > 0).length

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold">Kelola Prestasi</h1>
          <p className="text-sm text-gray-400 mt-0.5">Lihat, edit, atau hapus data yang diinput musyrif</p>
        </div>
        {msg && <span className="text-sm text-emerald-600 font-medium">{msg}</span>}
      </div>

      {/* Tab kelas */}
      <div className="flex gap-1 mb-0 border-b border-gray-200 overflow-x-auto">
        {kelasList.map(k => (
          <button key={k.id} onClick={() => selectKelas(k)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors
              ${activeKelas?.id === k.id
                ? 'bg-white border border-b-white border-gray-200 text-purple-700 -mb-px'
                : 'text-gray-500 hover:text-gray-700'}`}>
            {k.nama}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-100 rounded-b-xl rounded-tr-xl">
        {/* Sub-header statistik */}
        {!loading && santriData.length > 0 && (
          <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-4 flex-wrap">
            <span className="text-xs text-gray-500">{santriData.length} santri</span>
            <span className="text-xs text-emerald-600 font-medium">{sudahIsi} sudah ada data</span>
            <span className="text-xs text-gray-400">{totalEntri} total entri</span>
            <div className="ml-auto flex gap-2">
              <button onClick={() => setExpanded(new Set(santriData.map(s => s.id)))}
                className="text-xs text-gray-400 hover:text-gray-600">Buka semua</button>
              <span className="text-gray-200">|</span>
              <button onClick={() => setExpanded(new Set())}
                className="text-xs text-gray-400 hover:text-gray-600">Tutup semua</button>
            </div>
          </div>
        )}

        {loading && (
          <div className="py-16 text-center text-sm text-gray-400">Memuat data...</div>
        )}

        {!loading && santriData.length === 0 && (
          <div className="py-16 text-center text-sm text-gray-400">
            Belum ada santri di kelas ini
          </div>
        )}

        {/* Daftar santri */}
        <div className="divide-y divide-gray-50">
          {santriData.map(santri => {
            const isOpen = expandedSantri.has(santri.id)
            return (
              <div key={santri.id}>
                {/* Row santri — header accordion */}
                <button
                  onClick={() => toggleExpand(santri.id)}
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50
                             transition-colors text-left group">
                  <span className="w-7 h-7 rounded-full bg-purple-50 text-purple-600 text-xs
                                   font-semibold flex items-center justify-center flex-shrink-0">
                    {santri.no_urut}
                  </span>
                  <span className="font-medium text-gray-800 text-sm flex-1">{santri.nama}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                    ${santri.prestasi.length > 0
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-gray-100 text-gray-400'}`}>
                    {santri.prestasi.length > 0 ? `${santri.prestasi.length} entri` : 'Belum ada data'}
                  </span>
                  <span className="text-gray-300 group-hover:text-gray-400 text-sm ml-1">
                    {isOpen ? '▲' : '▼'}
                  </span>
                </button>

                {/* Detail prestasi — accordion content */}
                {isOpen && (
                  <div className="px-5 pb-4 bg-gray-50/50">
                    {santri.prestasi.length === 0 && (
                      <p className="text-xs text-gray-400 py-3 pl-10">
                        Musyrif belum mengisi data untuk santri ini.
                      </p>
                    )}

                    {santri.prestasi.map((p, pi) => (
                      <div key={p.id}
                        className="ml-10 mt-3 bg-white border border-gray-100 rounded-xl p-4">
                        {/* Header entri */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs text-gray-400">
                            Entri {pi + 1} ·{' '}
                            {new Date(p.updated_at).toLocaleDateString('id-ID', {
                              day: 'numeric', month: 'short', year: 'numeric'
                            })}
                          </span>
                          <div className="flex gap-2">
                            <button onClick={() => startEdit(p)}
                              className="btn text-xs py-0.5 px-2">Edit</button>
                            <button onClick={() => hapusEntry(p.id)}
                              className="btn btn-danger text-xs py-0.5 px-2">Hapus</button>
                          </div>
                        </div>

                        {/* Mode edit */}
                        {editing?.id === p.id ? (
                          <div className="space-y-3">
                            {FIELD_LABELS.map(f => (
                              <div key={f.key as string}>
                                <label className="label">{f.label}</label>
                                <textarea rows={2}
                                  className="input text-sm"
                                  value={(editForm as any)[f.key] || ''}
                                  onChange={e => setEditForm(prev => ({
                                    ...prev, [f.key]: e.target.value
                                  }))} />
                              </div>
                            ))}
                            <div className="flex gap-2 pt-1">
                              <button onClick={saveEdit} disabled={saving}
                                className="btn btn-primary text-xs py-1">
                                {saving ? 'Menyimpan...' : 'Simpan'}
                              </button>
                              <button onClick={() => setEditing(null)}
                                className="btn text-xs py-1">Batal</button>
                            </div>
                          </div>
                        ) : (
                          /* Mode tampil */
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {FIELD_LABELS.map(f => {
                              const val = (p as any)[f.key]
                              if (!val) return null
                              return (
                                <div key={f.key as string}
                                  className={`rounded-lg border p-2.5 ${COLOR_MAP[f.color]}`}>
                                  <p className="text-xs font-semibold opacity-70 mb-1">{f.label}</p>
                                  <p className="text-xs whitespace-pre-line leading-relaxed">{val}</p>
                                </div>
                              )
                            })}
                            {FIELD_LABELS.every(f => !(p as any)[f.key]) && (
                              <p className="text-xs text-gray-400 col-span-2">Semua kolom kosong</p>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
