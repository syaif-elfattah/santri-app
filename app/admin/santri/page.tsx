'use client'
import { useEffect, useState, useCallback, useRef } from 'react'

type Kelas    = { id: string; nama: string }
type Santri   = { id: string; nama: string; no_urut: number; keterangan: string; kelas_id: string }
type RowDraft = { id?: string; no_urut: number; nama: string; keterangan: string }

// ── Modal Pindah Kelas ────────────────────────────────────────
function ModalPindahKelas({
  santri, kelasList, currentKelasId, onClose, onSaved
}: {
  santri: Santri
  kelasList: Kelas[]
  currentKelasId: string
  onClose: () => void
  onSaved: () => void
}) {
  const [targetKelasId, setTargetKelasId] = useState('')
  const [saving, setSaving]               = useState(false)
  const [error, setError]                 = useState('')

  const kelasTujuan = kelasList.filter(k => k.id !== currentKelasId)
  const currentNama = kelasList.find(k => k.id === currentKelasId)?.nama || ''

  const pindah = async () => {
    if (!targetKelasId) { setError('Pilih kelas tujuan'); return }
    setSaving(true)
    try {
      const rTujuan = await fetch(`/api/santri?kelas_id=${targetKelasId}`)
      const existingTujuan = await rTujuan.json()
      const maxNo = existingTujuan.length > 0
        ? Math.max(...existingTujuan.map((s: any) => s.no_urut)) : 0

      const res = await fetch(`/api/santri?id=${santri.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kelas_id: targetKelasId, no_urut: maxNo + 1 })
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error || 'Gagal memindahkan')
        setSaving(false)
        return
      }

      // Renumber sisa kelas asal
      const rAsal = await fetch(`/api/santri?kelas_id=${currentKelasId}`)
      const sisaAsal: any[] = await rAsal.json()
      const sorted = [...sisaAsal].sort((a, b) => a.no_urut - b.no_urut)
      await Promise.all(sorted.map((s, idx) =>
        fetch(`/api/santri?id=${s.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ no_urut: idx + 1 })
        })
      ))
      onSaved()
      onClose()
    } catch {
      setError('Terjadi kesalahan. Coba lagi.')
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-1">Pindah Kelas</h3>
        <p className="text-sm text-gray-500 mb-5">
          <span className="font-medium text-gray-700">{santri.nama}</span>
          <span className="mx-2 text-gray-400">·</span>
          <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">{currentNama}</span>
        </p>
        <div className="mb-4">
          <label className="label">Pindah ke kelas</label>
          {kelasTujuan.length === 0 ? (
            <p className="text-sm text-gray-400 italic">Tidak ada kelas lain</p>
          ) : (
            <div className="grid grid-cols-3 gap-1.5 mt-1 max-h-48 overflow-y-auto pr-1">
              {kelasTujuan.map(k => (
                <button key={k.id} onClick={() => setTargetKelasId(k.id)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-colors text-center
                    ${targetKelasId === k.id
                      ? 'bg-emerald-600 text-white border-emerald-700'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-emerald-300'}`}>
                  {k.nama}
                </button>
              ))}
            </div>
          )}
        </div>
        {targetKelasId && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-700">
              ⚠ Data prestasi tetap tersimpan. Kelas berubah dari <strong>{currentNama}</strong> ke{' '}
              <strong>{kelasList.find(k => k.id === targetKelasId)?.nama}</strong>.
            </p>
          </div>
        )}
        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
        <div className="flex gap-2">
          <button onClick={onClose} className="btn flex-1">Batal</button>
          <button onClick={pindah} disabled={saving || !targetKelasId}
            className="btn btn-primary flex-1 disabled:opacity-50">
            {saving ? 'Memindahkan...' : 'Pindah Kelas'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Halaman Utama ─────────────────────────────────────────────
const STORAGE_KEY = 'santri_active_kelas_id'

export default function SantriPage() {
  const [kelasList, setKelasList]       = useState<Kelas[]>([])
  const [activeKelas, setActiveKelas]   = useState<Kelas | null>(null)
  const [santriList, setSantriList]     = useState<Santri[]>([])
  const [draft, setDraft]               = useState<RowDraft[]>([])
  const [editMode, setEditMode]         = useState(false)
  const [saving, setSaving]             = useState(false)
  const [loadingKelas, setLoadingKelas] = useState(false)
  const [msg, setMsg]                   = useState('')
  const [pasteActive, setPasteActive]   = useState(false)
  const [modalSantri, setModalSantri]   = useState<Santri | null>(null)
  const [tab, setTab]                   = useState<'input'|'daftar'>('input')
  const [rapikan, setRapikan]           = useState(false)
  const [loadingAssign, setLoadingAssign] = useState(false)
  const activeKelasRef = useRef<Kelas | null>(null)

  // Simpan activeKelas ke ref agar selalu up-to-date di callback
  useEffect(() => { activeKelasRef.current = activeKelas }, [activeKelas])

  // Load kelas — ingat kelas terakhir yang dipilih
  useEffect(() => {
    fetch('/api/kelas').then(r => r.json()).then((k: Kelas[]) => {
      setKelasList(k)
      if (!k.length) return
      // Coba restore kelas terakhir dari localStorage
      const lastId = typeof window !== 'undefined'
        ? localStorage.getItem(STORAGE_KEY) : null
      const last = lastId ? k.find(x => x.id === lastId) : null
      selectKelas(last || k[0])
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const fetchSantri = async (kelasId: string): Promise<Santri[]> => {
    const ts = Date.now()
    const r = await fetch(`/api/santri?kelas_id=${kelasId}&_t=${ts}`, {
      cache: 'no-store',
      headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' }
    })
    return r.json()
  }

  const selectKelas = async (k: Kelas) => {
    setActiveKelas(k)
    setEditMode(false)
    setLoadingKelas(true)
    setSantriList([])
    setDraft([])
    // Simpan kelas terakhir
    if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, k.id)
    const data = await fetchSantri(k.id)
    setSantriList(data)
    setDraft(data.map(s => ({ id: s.id, no_urut: s.no_urut, nama: s.nama, keterangan: s.keterangan })))
    setLoadingKelas(false)
  }

  const reloadKelas = async () => {
    const k = activeKelasRef.current
    if (!k) return
    setLoadingKelas(true)
    const data = await fetchSantri(k.id)
    setSantriList(data)
    setDraft(data.map(s => ({ id: s.id, no_urut: s.no_urut, nama: s.nama, keterangan: s.keterangan })))
    setEditMode(false)
    setLoadingKelas(false)
  }

  const parsePasteText = useCallback((text: string) => {
    const lines = text.split(/\r?\n/).filter(l => l.trim())
    if (!lines.length) return
    const newRows: RowDraft[] = []
    lines.forEach(line => {
      const parts = line.split('\t').map(p => p.trim())
      let no_urut = 0, nama = '', keterangan = ''
      if (parts.length === 1) {
        if (/^\d+$/.test(parts[0])) return
        nama = parts[0]
      } else {
        if (/^\d+$/.test(parts[0])) { no_urut = parseInt(parts[0]); nama = parts[1]; keterangan = parts[2] || '' }
        else { nama = parts[0]; keterangan = parts[1] || '' }
      }
      if (nama.trim()) newRows.push({ no_urut, nama: nama.trim(), keterangan: keterangan.trim() })
    })
    if (!newRows.length) return
    setDraft(prev => {
      const maxNo = prev.length > 0 ? Math.max(...prev.map(d => d.no_urut)) : 0
      let counter = maxNo
      const filled = newRows.map(r => r.no_urut === 0 ? { ...r, no_urut: ++counter } : r)
      return [...prev, ...filled]
    })
    setEditMode(true)
    flash(`✓ ${newRows.length} santri ditambahkan dari paste`)
  }, [])

  useEffect(() => {
    const handler = (e: ClipboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      e.preventDefault()
      parsePasteText(e.clipboardData?.getData('text') || '')
    }
    window.addEventListener('paste', handler)
    return () => window.removeEventListener('paste', handler)
  }, [parsePasteText])

  const hapusSantri = async (s: Santri) => {
    if (!confirm('Hapus ' + s.nama + '?\nData prestasi santri ini tidak ikut terhapus.')) return
    const res = await fetch(`/api/santri?id=${s.id}`, { method: 'DELETE' })
    if (res.ok) { flash('✓ ' + s.nama + ' dihapus'); await reloadKelas() }
    else flash('Error: gagal menghapus')
  }

  const addRow = () => {
    const nextNo = draft.length > 0 ? Math.max(...draft.map(d => d.no_urut)) + 1 : 1
    setDraft(d => [...d, { no_urut: nextNo, nama: '', keterangan: '' }])
    setEditMode(true)
  }

  const updateDraft = (i: number, field: keyof RowDraft, value: string | number) => {
    setDraft(d => d.map((r, idx) => idx === i ? { ...r, [field]: value } : r))
    setEditMode(true)
  }

  const removeRow = (i: number) => {
    setDraft(d => d.filter((_, idx) => idx !== i))
    setEditMode(true)
  }

  const saveAll = async () => {
    if (!activeKelas) return
    setSaving(true)
    try {
      const bulk = draft
        .filter(r => r.nama.trim())
        .map(r => ({ id: r.id, no_urut: r.no_urut, nama: r.nama, keterangan: r.keterangan }))
      const res = await fetch('/api/santri', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kelas_id: activeKelas.id, bulk })
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      flash(`✓ ${d.inserted} santri disimpan`)
      await reloadKelas()
    } catch (e: any) {
      setMsg('Error: ' + e.message)
      setTimeout(() => setMsg(''), 4000)
    } finally {
      setSaving(false)
    }
  }

  const flash = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  const rapikanNomor = async () => {
    if (!activeKelas) return
    if (!confirm('Rapikan nomor urut santri di ' + activeKelas.nama + '?\nNomor akan diurutkan ulang dari 1.')) return
    setRapikan(true)
    try {
      const list = await fetchSantri(activeKelas.id)
      const sorted = [...list].sort((a, b) => a.no_urut - b.no_urut)
      // Step 1: nomor sementara besar
      await Promise.all(sorted.map((s, idx) =>
        fetch(`/api/santri?id=${s.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ no_urut: 99000 + idx + 1 })
        })
      ))
      // Step 2: nomor final
      await Promise.all(sorted.map((s, idx) =>
        fetch(`/api/santri?id=${s.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ no_urut: idx + 1 })
        })
      ))
      await reloadKelas()
      flash('✓ Nomor urut berhasil dirapikan')
    } catch {
      flash('Error: gagal merapikan nomor urut')
    }
    setRapikan(false)
  }

  return (
    <div>
      {modalSantri && activeKelas && (
        <ModalPindahKelas
          santri={modalSantri}
          kelasList={kelasList}
          currentKelasId={activeKelas.id}
          onClose={() => setModalSantri(null)}
          onSaved={() => { reloadKelas(); flash('✓ Santri berhasil dipindahkan') }}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Data Santri</h1>
          <p className="text-sm text-gray-400 mt-0.5">Kelola nama santri per kelas</p>
        </div>
        <div className="flex gap-2">
          {editMode && tab === 'input' && (
            <button onClick={saveAll} disabled={saving} className="btn btn-primary text-sm">
              {saving ? 'Menyimpan...' : '💾 Simpan perubahan'}
            </button>
          )}
          {tab === 'input' && <button onClick={addRow} className="btn text-sm">+ Tambah baris</button>}
        </div>
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

      <div className="card rounded-tl-none mt-0">
        <div className="flex gap-1 mb-4 bg-gray-100 p-1 rounded-lg w-fit">
          <button onClick={() => setTab('input')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors
              ${tab === 'input' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            ✏️ Input / Edit Nama
          </button>
          <button onClick={() => setTab('daftar')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors
              ${tab === 'daftar' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            🔄 Pindah Kelas
          </button>
        </div>

        {msg && (
          <div className={`mb-3 px-3 py-2 rounded-lg border text-xs font-medium
            ${msg.startsWith('Error') ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
            {msg}
          </div>
        )}

        {/* TAB: Input */}
        {tab === 'input' && (
          <>
            <div
              tabIndex={0}
              onFocus={() => setPasteActive(true)}
              onBlur={() => setPasteActive(false)}
              onPaste={e => { e.preventDefault(); parsePasteText(e.clipboardData.getData('text')) }}
              className={`mb-4 p-3 border rounded-lg transition-all cursor-pointer outline-none select-none
                ${pasteActive
                  ? 'border-emerald-400 bg-emerald-50 ring-2 ring-emerald-200'
                  : 'border-dashed border-gray-300 bg-gray-50 hover:border-emerald-300 hover:bg-emerald-50'}`}>
              <p className={`text-xs text-center ${pasteActive ? 'text-emerald-700 font-medium' : 'text-gray-500'}`}>
                {pasteActive
                  ? '✅ Siap! Tekan Ctrl+V sekarang'
                  : <>📋 Klik di sini → tekan <kbd className="bg-white border border-gray-200 rounded px-1 font-mono">Ctrl+V</kbd> untuk paste dari Excel</>}
              </p>
              {!pasteActive && (
                <p className="text-xs text-center text-gray-400 mt-1">
                  Format: kolom A = No Urut, kolom B = Nama Santri
                </p>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-2 text-left text-xs font-medium text-gray-400 w-20">No</th>
                    <th className="pb-2 text-left text-xs font-medium text-gray-400">Nama Santri</th>
                    <th className="pb-2 text-left text-xs font-medium text-gray-400 hidden sm:table-cell">Keterangan</th>
                    <th className="pb-2 w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {loadingKelas && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center">
                        <div className="flex items-center justify-center gap-2 text-gray-400">
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                          </svg>
                          <span className="text-sm">Memuat data santri...</span>
                        </div>
                      </td>
                    </tr>
                  )}
                  {!loadingKelas && draft.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-sm text-gray-400">
                        Belum ada santri.<br/>
                        <span className="text-xs">Paste dari Excel atau klik "+ Tambah baris"</span>
                      </td>
                    </tr>
                  )}
                  {draft.map((row, i) => (
                    <tr key={row.id || i} className="border-b border-gray-50 hover:bg-gray-50 group">
                      <td className="py-1 pr-2">
                        <input type="number" min={1} className="input text-center w-16 py-1 text-sm"
                          value={row.no_urut}
                          onChange={e => updateDraft(i, 'no_urut', parseInt(e.target.value) || 1)} />
                      </td>
                      <td className="py-1 pr-2">
                        <input className="input py-1 text-sm" placeholder="Nama santri..."
                          value={row.nama}
                          onChange={e => updateDraft(i, 'nama', e.target.value)} />
                      </td>
                      <td className="py-1 pr-2 hidden sm:table-cell">
                        <input className="input py-1 text-sm text-gray-500" placeholder="—"
                          value={row.keterangan}
                          onChange={e => updateDraft(i, 'keterangan', e.target.value)} />
                      </td>
                      <td className="py-1 text-center">
                        <div className="flex gap-1 justify-center opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => removeRow(i)}
                            className="w-6 h-6 rounded text-gray-300 hover:text-gray-500 hover:bg-gray-100
                                       transition-all text-xl leading-none"
                            title="Hapus dari daftar (belum disimpan)">×</button>
                          {row.id && (
                            <button
                              onClick={async () => {
                                if (!confirm('Hapus ' + row.nama + '?\nData prestasi santri ini tidak ikut terhapus.')) return
                                const res = await fetch(`/api/santri?id=${row.id}`, { method: 'DELETE' })
                                if (res.ok) { flash('✓ ' + row.nama + ' dihapus'); await reloadKelas() }
                                else flash('Error: gagal menghapus')
                              }}
                              className="w-6 h-6 rounded text-red-300 hover:text-red-500 hover:bg-red-50
                                         transition-all text-sm leading-none flex items-center justify-center"
                              title="Hapus permanen">🗑</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                {draft.filter(r => r.nama.trim()).length} santri
                {editMode && <span className="text-amber-500 ml-2 font-medium">· Belum disimpan</span>}
              </span>
              <button onClick={addRow} className="text-xs text-emerald-600 hover:underline">+ Tambah baris</button>
            </div>
          </>
        )}

        {/* TAB: Pindah Kelas */}
        {tab === 'daftar' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-gray-500">
                Tap <strong>Pindah</strong> untuk pindah kelas. Data prestasi tidak terhapus.
              </p>
              <button onClick={rapikanNomor} disabled={rapikan}
                className="btn text-xs py-1 text-amber-600 border-amber-200 hover:bg-amber-50 disabled:opacity-50">
                {rapikan ? '⏳ Merapikan...' : '🔢 Rapikan Nomor Urut'}
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {loadingKelas && (
                <div className="py-8 text-center flex items-center justify-center gap-2 text-gray-400">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                  </svg>
                  <span className="text-sm">Memuat...</span>
                </div>
              )}
              {!loadingKelas && santriList.length === 0 && (
                <p className="py-8 text-center text-sm text-gray-400">Belum ada santri di kelas ini</p>
              )}
              {santriList.map(s => (
                <div key={s.id} className="flex items-center gap-3 py-2.5 group">
                  <span className="w-7 h-7 rounded-full bg-purple-50 text-purple-600 text-xs
                                   font-semibold flex items-center justify-center flex-shrink-0">
                    {s.no_urut}
                  </span>
                  <span className="text-sm text-gray-800 flex-1">{s.nama}</span>
                  {s.keterangan && (
                    <span className="text-xs text-gray-400 hidden sm:inline">{s.keterangan}</span>
                  )}
                  <button onClick={() => setModalSantri(s)}
                    className="btn text-xs py-1 text-purple-600 border-purple-200 hover:bg-purple-50 flex-shrink-0">
                    🔄 Pindah
                  </button>
                  <button onClick={() => hapusSantri(s)}
                    className="btn text-xs py-1 text-red-400 border-red-200 hover:bg-red-50
                               flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    🗑 Hapus
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
