'use client'
import { useEffect, useState, useCallback } from 'react'

type Kelas    = { id: string; nama: string }
type Santri   = { id: string; nama: string; no_urut: number; keterangan: string }
type RowDraft = { no_urut: number; nama: string; keterangan: string }

export default function SantriPage() {
  const [kelasList, setKelasList]     = useState<Kelas[]>([])
  const [activeKelas, setActiveKelas] = useState<Kelas | null>(null)
  const [draft, setDraft]             = useState<RowDraft[]>([])
  const [editMode, setEditMode]       = useState(false)
  const [saving, setSaving]           = useState(false)
  const [msg, setMsg]                 = useState('')
  const [pasteActive, setPasteActive] = useState(false)

  useEffect(() => {
    fetch('/api/kelas').then(r => r.json()).then((k: Kelas[]) => {
      setKelasList(k)
      if (k.length) selectKelas(k[0])
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const parsePasteText = useCallback((text: string) => {
    const lines = text.split(/\r?\n/).filter(l => l.trim())
    if (!lines.length) return

    const newRows: RowDraft[] = []

    lines.forEach(line => {
      const parts = line.split('\t').map(p => p.trim())
      let no_urut = 0
      let nama = ''
      let keterangan = ''

      if (parts.length === 1) {
        if (/^\d+$/.test(parts[0])) return   // angka saja → skip
        nama = parts[0]
      } else {
        if (/^\d+$/.test(parts[0])) {
          no_urut = parseInt(parts[0])
          nama = parts[1] || ''
          keterangan = parts[2] || ''
        } else {
          nama = parts[0]
          keterangan = parts[1] || ''
        }
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
    setMsg(`✓ ${newRows.length} santri ditambahkan dari paste`)
    setTimeout(() => setMsg(''), 3000)
  }, [])

  // Global paste — aktif saat tidak ada input yang difokus
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

  const selectKelas = async (k: Kelas) => {
    setActiveKelas(k)
    setEditMode(false)
    const r = await fetch(`/api/santri?kelas_id=${k.id}`)
    const data: Santri[] = await r.json()
    setDraft(data.map(s => ({ no_urut: s.no_urut, nama: s.nama, keterangan: s.keterangan })))
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
      const bulk = draft.filter(r => r.nama.trim())
      const res = await fetch('/api/santri', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kelas_id: activeKelas.id, bulk })
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setMsg(`✓ ${d.inserted} santri disimpan`)
      setEditMode(false)
      await selectKelas(activeKelas)
    } catch (e: any) {
      setMsg('Error: ' + e.message)
    } finally {
      setSaving(false)
      setTimeout(() => setMsg(''), 4000)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Data Santri</h1>
          <p className="text-sm text-gray-400 mt-0.5">Kelola nama santri per kelas</p>
        </div>
        <div className="flex gap-2">
          {editMode && (
            <button onClick={saveAll} disabled={saving} className="btn btn-primary text-sm">
              {saving ? 'Menyimpan...' : '💾 Simpan perubahan'}
            </button>
          )}
          <button onClick={addRow} className="btn text-sm">+ Tambah baris</button>
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

        {/* Zona paste — div focusable, tangkap paste event langsung */}
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
              ? '✅ Siap! Tekan Ctrl+V sekarang untuk paste data dari Excel'
              : <>
                  📋 Klik di sini → lalu tekan{' '}
                  <kbd className="bg-white border border-gray-200 rounded px-1 font-mono">Ctrl+V</kbd>
                  {' '}untuk paste banyak nama sekaligus dari Excel
                </>
            }
          </p>
          {!pasteActive && (
            <p className="text-xs text-center text-gray-400 mt-1">
              Format Excel: kolom A = No Urut, kolom B = Nama Santri — salin keduanya lalu paste
            </p>
          )}
        </div>

        {msg && (
          <div className={`mb-3 px-3 py-2 rounded-lg border text-xs font-medium
            ${msg.startsWith('Error')
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
            {msg}
          </div>
        )}

        {/* Tabel */}
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
              {draft.map((row, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 group">
                  <td className="py-1 pr-2">
                    <input type="number" min={1}
                      className="input text-center w-16 py-1 text-sm"
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
                    <button onClick={() => removeRow(i)}
                      className="w-6 h-6 rounded text-red-300 hover:text-red-500 hover:bg-red-50
                                 opacity-0 group-hover:opacity-100 transition-all text-xl leading-none">
                      ×
                    </button>
                  </td>
                </tr>
              ))}
              {draft.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-sm text-gray-400">
                    Belum ada santri di kelas ini.<br/>
                    <span className="text-xs">Paste dari Excel atau klik "+ Tambah baris"</span>
                  </td>
                </tr>
              )}
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
      </div>
    </div>
  )
}
