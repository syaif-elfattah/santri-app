'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

type Kelas    = { id: string; nama: string }
type Santri   = { id: string; nama: string; no_urut: number }
type Prestasi = {
  id: string; santri_id: string
  kegiatan_sekolah: string; kegiatan_pondok: string
  prestasi_sekolah: string; prestasi_pondok: string
  progres_pribadi: string; updated_at: string
}
type SantriWithPrestasi = Santri & { prestasi: Prestasi[] }

const KEGIATAN_SEK = ['OSIS','Pramuka','PMR','Futsal','Paskibra','KIR','Basket','Tonti']
const KEGIATAN_PON = ['Tahfidz','Kajian kitab','OSIS Pondok','Nasyid','Ketua kamar','Tilawah','Bahasa Arab']
const PROGRES_TAGS = ['Lebih disiplin','Lebih percaya diri','Aktif membantu teman',
                      'Rajin berjamaah','Sopan kepada ustadz','Mengurangi gadget']

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

// ─────────────────────────────────────────────────────────────
//  KOMPONEN ListInput
//  Nilai disimpan sebagai string multiline (dipisah \n)
//  Tampilan: tiap baris = 1 input, ada + Tambah dan × hapus
// ─────────────────────────────────────────────────────────────
function ListInput({
  value, onChange, placeholder
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  // Parse string multiline → array of items (strip bullet jika ada)
  const toItems = (v: string) =>
    v.split('\n').map(l => l.replace(/^•\s*/, '').trim()).filter(Boolean)

  const fromItems = (items: string[]) => items.filter(Boolean).join('\n')

  const items = value ? toItems(value) : ['']

  const update = (idx: number, val: string) => {
    const next = [...items]
    next[idx] = val
    onChange(fromItems(next.length ? next : ['']))
  }

  const addItem = () => {
    onChange(fromItems([...items, '']))
  }

  const removeItem = (idx: number) => {
    const next = items.filter((_, i) => i !== idx)
    onChange(fromItems(next.length ? next : []))
  }

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      // Tambah item baru setelah baris ini
      const next = [...items]
      next.splice(idx + 1, 0, '')
      onChange(fromItems(next))
      // Fokus ke input baru
      setTimeout(() => inputRefs.current[idx + 1]?.focus(), 30)
    }
    if (e.key === 'Backspace' && items[idx] === '' && items.length > 1) {
      e.preventDefault()
      removeItem(idx)
      setTimeout(() => inputRefs.current[Math.max(0, idx - 1)]?.focus(), 30)
    }
  }

  return (
    <div className="space-y-1.5">
      {items.map((item, idx) => (
        <div key={idx} className="flex items-center gap-2 group">
          <span className="text-gray-300 text-sm flex-shrink-0 w-4 text-center">•</span>
          <input
            ref={el => { inputRefs.current[idx] = el }}
            className="input py-1.5 text-sm flex-1"
            value={item}
            placeholder={idx === 0 ? placeholder : 'Tambah lagi...'}
            onChange={e => update(idx, e.target.value)}
            onKeyDown={e => handleKeyDown(e, idx)}
          />
          {items.length > 1 && (
            <button onClick={() => removeItem(idx)}
              className="text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100
                         transition-all text-lg leading-none flex-shrink-0 w-5 text-center">
              ×
            </button>
          )}
        </div>
      ))}
      <button onClick={addItem}
        className="text-xs text-emerald-600 hover:text-emerald-700 hover:underline
                   flex items-center gap-1 pl-6 mt-1">
        + Tambah item
      </button>
      <p className="text-xs text-gray-300 pl-6">Tekan Enter untuk item baru, Backspace untuk hapus baris kosong</p>
    </div>
  )
}

type FormData = {
  kegiatan_sekolah: string; kegiatan_pondok: string
  prestasi_sekolah: string; prestasi_pondok: string; progres_pribadi: string
}
const emptyForm = (): FormData => ({
  kegiatan_sekolah:'', kegiatan_pondok:'',
  prestasi_sekolah:'', prestasi_pondok:'', progres_pribadi:''
})

// Tambahkan bullet • di depan tiap baris saat disimpan
const addBullets = (text: string) =>
  text.split('\n')
    .map(l => l.trim())
    .filter(Boolean)
    .map(l => l.startsWith('•') ? l : `• ${l}`)
    .join('\n')

// ─────────────────────────────────────────────────────────────
//  TAB REKAP
// ─────────────────────────────────────────────────────────────
function RekapTab({ kelas }: { kelas: Kelas }) {
  const [data, setData]         = useState<SantriWithPrestasi[]>([])
  const [loading, setLoading]   = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    setLoading(true)
    fetch(`/api/santri?kelas_id=${kelas.id}`)
      .then(r => r.json())
      .then(async (santriList: Santri[]) => {
        const withPrestasi = await Promise.all(
          santriList.map(async s => {
            const pr = await fetch(`/api/prestasi?santri_id=${s.id}`)
            return { ...s, prestasi: await pr.json() as Prestasi[] }
          })
        )
        setData(withPrestasi)
        setExpanded(new Set(santriList.map(s => s.id)))
        setLoading(false)
      })
  }, [kelas.id])

  const toggle = (id: string) =>
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })

  const sudahIsi = data.filter(s => s.prestasi.length > 0).length

  if (loading) return (
    <div className="py-16 text-center text-sm text-gray-400">Memuat data rekap...</div>
  )

  return (
    <div>
      <div className="flex gap-4 px-1 mb-4 flex-wrap items-center">
        <span className="text-xs text-gray-500">{data.length} santri</span>
        <span className="text-xs text-emerald-600 font-medium">{sudahIsi} sudah ada data</span>
        <span className="text-xs text-gray-400">{data.length - sudahIsi} belum ada data</span>
        <div className="ml-auto flex gap-3">
          <button onClick={() => setExpanded(new Set(data.map(s => s.id)))}
            className="text-xs text-gray-400 hover:text-gray-600">Buka semua</button>
          <button onClick={() => setExpanded(new Set())}
            className="text-xs text-gray-400 hover:text-gray-600">Tutup semua</button>
        </div>
      </div>

      <div className="card p-0 overflow-hidden divide-y divide-gray-50">
        {data.map(santri => {
          const isOpen = expanded.has(santri.id)
          return (
            <div key={santri.id}>
              <button onClick={() => toggle(santri.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left group">
                <span className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 text-xs
                                 font-semibold flex items-center justify-center flex-shrink-0">
                  {santri.no_urut}
                </span>
                <span className="font-medium text-gray-800 text-sm flex-1">{santri.nama}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                  ${santri.prestasi.length > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                  {santri.prestasi.length > 0 ? `${santri.prestasi.length} entri` : 'Belum ada'}
                </span>
                <span className="text-gray-300 text-sm">{isOpen ? '▲' : '▼'}</span>
              </button>

              {isOpen && (
                <div className="px-4 pb-4 bg-gray-50/50">
                  {santri.prestasi.length === 0 && (
                    <p className="text-xs text-gray-400 py-3 pl-10">Belum ada data yang diisi.</p>
                  )}
                  {santri.prestasi.map((p, pi) => (
                    <div key={p.id} className="ml-10 mt-3 bg-white border border-gray-100 rounded-xl p-4">
                      <p className="text-xs text-gray-400 mb-3">
                        Entri {pi + 1} · {new Date(p.updated_at).toLocaleDateString('id-ID',
                          { day:'numeric', month:'short', year:'numeric' })}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {FIELD_LABELS.map(f => {
                          const val = (p as any)[f.key]
                          if (!val) return null
                          return (
                            <div key={f.key as string} className={`rounded-lg border p-2.5 ${COLOR_MAP[f.color]}`}>
                              <p className="text-xs font-semibold opacity-70 mb-1">{f.label}</p>
                              <p className="text-xs whitespace-pre-line leading-relaxed">{val}</p>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
        {data.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-400">Belum ada santri di kelas ini</div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  TAB INPUT
// ─────────────────────────────────────────────────────────────
function InputTab({ kelas }: { kelas: Kelas }) {
  const [santriList, setSantriList]   = useState<Santri[]>([])
  const [selectedSantri, setSelected] = useState<Santri | null>(null)
  const [form, setForm]               = useState<FormData>(emptyForm())
  const [tagsSek, setTagsSek]         = useState<string[]>([])
  const [tagsPon, setTagsPon]         = useState<string[]>([])
  const [saving, setSaving]           = useState(false)
  const [saved, setSaved]             = useState(false)
  const [error, setError]             = useState('')

  useEffect(() => {
    fetch(`/api/santri?kelas_id=${kelas.id}`)
      .then(r => r.json()).then(setSantriList)
  }, [kelas.id])

  const selectSantri = (s: Santri) => {
    setSelected(s); setForm(emptyForm())
    setTagsSek([]); setTagsPon([])
    setSaved(false); setError('')
  }

  const toggleSek = (t: string) =>
    setTagsSek(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t])
  const togglePon = (t: string) =>
    setTagsPon(p => p.includes(t) ? p.filter(x => x !== t) : [...p, t])

  // Gabung tag + isian manual, semua diberi bullet
  const buildField = (tags: string[], manual: string) => {
    const tagLines = tags.map(t => `• ${t}`)
    const manualLines = manual.split('\n')
      .map(l => l.replace(/^•\s*/, '').trim())
      .filter(Boolean)
      .map(l => `• ${l}`)
    return [...tagLines, ...manualLines].join('\n')
  }

  const handleSave = async () => {
    if (!selectedSantri) return
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/prestasi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          santri_id:        selectedSantri.id,
          kegiatan_sekolah: buildField(tagsSek, form.kegiatan_sekolah),
          kegiatan_pondok:  buildField(tagsPon, form.kegiatan_pondok),
          prestasi_sekolah: addBullets(form.prestasi_sekolah),
          prestasi_pondok:  addBullets(form.prestasi_pondok),
          progres_pribadi:  addBullets(form.progres_pribadi),
        })
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setSaved(true)
    } catch (e: any) { setError(e.message) }
    finally { setSaving(false) }
  }

  const handleNext = () => {
    const idx = santriList.findIndex(s => s.id === selectedSantri?.id)
    const next = santriList[idx + 1]
    if (next) selectSantri(next)
    else { setSelected(null); setSaved(false) }
  }

  const initials = (nama: string) =>
    nama.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase()

  if (saved && selectedSantri) return (
    <div className="card text-center py-10">
      <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">✅</div>
      <h3 className="font-medium text-gray-900 mb-1">Data tersimpan!</h3>
      <p className="text-sm text-gray-400 mb-6">{selectedSantri.nama}</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button onClick={handleNext} className="btn btn-primary">Santri berikutnya →</button>
        <button onClick={() => { setSelected(null); setSaved(false) }} className="btn">Kembali ke daftar</button>
      </div>
    </div>
  )

  if (!selectedSantri) return (
    <div className="card divide-y divide-gray-50 p-0 overflow-hidden">
      {santriList.map(s => (
        <button key={s.id} onClick={() => selectSantri(s)}
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left group">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center
                          text-xs font-medium text-emerald-700 flex-shrink-0">
            {s.no_urut}
          </div>
          <span className="text-sm text-gray-800 group-hover:text-emerald-700 flex-1">{s.nama}</span>
          <span className="text-gray-300 group-hover:text-emerald-400 text-sm">→</span>
        </button>
      ))}
      {santriList.length === 0 && (
        <p className="py-10 text-center text-sm text-gray-400">Belum ada santri di kelas ini</p>
      )}
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Info santri */}
      <div className="flex items-center gap-3 card bg-emerald-50 border-emerald-100">
        <div className="w-10 h-10 rounded-full bg-emerald-200 flex items-center justify-center
                        text-sm font-medium text-emerald-800 flex-shrink-0">
          {initials(selectedSantri.nama)}
        </div>
        <div className="flex-1">
          <p className="font-medium text-gray-900">{selectedSantri.nama}</p>
          <p className="text-xs text-gray-500">{kelas.nama} · No. {selectedSantri.no_urut}</p>
        </div>
        <button onClick={() => setSelected(null)} className="text-xs text-gray-400 hover:text-gray-600">Ganti</button>
      </div>

      {/* Kegiatan */}
      <div className="card">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Kegiatan</p>

        <div className="mb-4">
          <p className="label">Di sekolah — pilih cepat</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {KEGIATAN_SEK.map(t => (
              <button key={t} onClick={() => toggleSek(t)}
                className={`tag-pill ${tagsSek.includes(t) ? 'active' : ''}`}>
                {tagsSek.includes(t) ? '✓ ' : '+ '}{t}
              </button>
            ))}
          </div>
          <p className="label">Atau isi sendiri</p>
          <ListInput
            value={form.kegiatan_sekolah}
            onChange={v => setForm(f => ({...f, kegiatan_sekolah: v}))}
            placeholder="Ketik kegiatan lain..."
          />
        </div>

        <div>
          <p className="label">Di pondok — pilih cepat</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {KEGIATAN_PON.map(t => (
              <button key={t} onClick={() => togglePon(t)}
                className={`tag-pill ${tagsPon.includes(t) ? 'active' : ''}`}>
                {tagsPon.includes(t) ? '✓ ' : '+ '}{t}
              </button>
            ))}
          </div>
          <p className="label">Atau isi sendiri</p>
          <ListInput
            value={form.kegiatan_pondok}
            onChange={v => setForm(f => ({...f, kegiatan_pondok: v}))}
            placeholder="Ketik kegiatan lain..."
          />
        </div>
      </div>

      {/* Prestasi */}
      <div className="card">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Prestasi</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="label">Di sekolah</p>
            <ListInput
              value={form.prestasi_sekolah}
              onChange={v => setForm(f => ({...f, prestasi_sekolah: v}))}
              placeholder="Juara 1 Olimpiade..."
            />
          </div>
          <div>
            <p className="label">Di pondok</p>
            <ListInput
              value={form.prestasi_pondok}
              onChange={v => setForm(f => ({...f, prestasi_pondok: v}))}
              placeholder="Hafiz naik 8 juz..."
            />
          </div>
        </div>
      </div>

      {/* Progres */}
      <div className="card">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Progres Pribadi</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {PROGRES_TAGS.map(t => (
            <button key={t} onClick={() =>
              setForm(f => ({
                ...f,
                progres_pribadi: f.progres_pribadi.trim() ? f.progres_pribadi + '\n' + t : t
              }))}
              className="tag-pill">+ {t}
            </button>
          ))}
        </div>
        <ListInput
          value={form.progres_pribadi}
          onChange={v => setForm(f => ({...f, progres_pribadi: v}))}
          placeholder="Tuliskan perubahan positif yang diamati..."
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <div className="flex gap-3 pb-6">
        <button onClick={handleSave} disabled={saving} className="btn btn-primary flex-1">
          {saving ? 'Menyimpan...' : 'Simpan data ini'}
        </button>
        <button onClick={() => setSelected(null)} className="btn">Batal</button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  HALAMAN UTAMA
// ─────────────────────────────────────────────────────────────
export default function InputPage() {
  const [kelasList, setKelasList]     = useState<Kelas[]>([])
  const [activeKelas, setActiveKelas] = useState<Kelas | null>(null)
  const [activeTab, setActiveTab]     = useState<'input' | 'rekap'>('input')

  useEffect(() => {
    fetch('/api/kelas').then(r => r.json()).then((k: Kelas[]) => {
      setKelasList(k)
      if (k.length) setActiveKelas(k[0])
    })
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600">← Beranda</Link>
        <span className="text-sm font-medium text-gray-700">Prestasi Santri</span>
        <div className="w-16" />
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">

        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Pilih Kelas</p>
          <div className="flex gap-2 flex-wrap">
            {kelasList.map(k => (
              <button key={k.id} onClick={() => setActiveKelas(k)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors
                  ${activeKelas?.id === k.id
                    ? 'bg-emerald-600 text-white border-emerald-700'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-emerald-300 hover:text-emerald-700'}`}>
                {k.nama}
              </button>
            ))}
          </div>
        </div>

        {activeKelas && (
          <>
            <div className="flex gap-1 border-b border-gray-200">
              <button onClick={() => setActiveTab('input')}
                className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-colors
                  ${activeTab === 'input'
                    ? 'bg-white border border-b-white border-gray-200 text-emerald-700 -mb-px'
                    : 'text-gray-500 hover:text-gray-700'}`}>
                ✏️ Input Prestasi
              </button>
              <button onClick={() => setActiveTab('rekap')}
                className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition-colors
                  ${activeTab === 'rekap'
                    ? 'bg-white border border-b-white border-gray-200 text-emerald-700 -mb-px'
                    : 'text-gray-500 hover:text-gray-700'}`}>
                📋 Lihat Rekap Kelas
              </button>
            </div>

            {activeTab === 'input'
              ? <InputTab kelas={activeKelas} />
              : <RekapTab kelas={activeKelas} />
            }
          </>
        )}
      </div>
    </div>
  )
}
