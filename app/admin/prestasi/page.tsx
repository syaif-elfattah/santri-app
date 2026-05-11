'use client'
import { useEffect, useState } from 'react'

type Kelas = { id: string; nama: string }
type Santri = { id: string; nama: string; no_urut: number }
type JuzEntry = { juz: number; level: number }
type NonTahfidz = { juara: string; cabang: string; penyelenggara: string; bulan_tahun: string }
type Prestasi = {
  id: string; santri_id: string
  kegiatan_sekolah: string; kegiatan_pondok: string
  prestasi_tahfidz: JuzEntry[]; prestasi_non_tahfidz: NonTahfidz[]
  progres_pribadi: string; updated_at: string
}
type SantriWithPrestasi = Santri & { prestasi: Prestasi[] }

const JUZ_LEVEL_LABEL: Record<number,string> = { 1:'Full Juz', 2:'3/4 Juz', 3:'1/2 Juz', 4:'1/4 Juz' }
const FIELDS = [
  { key:'kegiatan_sekolah', label:'Kegiatan Sekolah', color:'blue' },
  { key:'kegiatan_pondok',  label:'Kegiatan Pondok',  color:'purple' },
  { key:'progres_pribadi',  label:'Progres Pribadi',  color:'rose' },
]
const COLOR_MAP: Record<string,string> = {
  blue:'bg-blue-50 text-blue-700 border-blue-100',
  purple:'bg-purple-50 text-purple-700 border-purple-100',
  rose:'bg-rose-50 text-rose-700 border-rose-100',
}

export default function PrestasiAdminPage() {
  const [kelasList, setKelasList]     = useState<Kelas[]>([])
  const [activeKelas, setActiveKelas] = useState<Kelas|null>(null)
  const [santriData, setSantriData]   = useState<SantriWithPrestasi[]>([])
  const [loading, setLoading]         = useState(false)
  const [editing, setEditing]         = useState<Prestasi|null>(null)
  const [editForm, setEditForm]       = useState<Partial<Prestasi>>({})
  const [saving, setSaving]           = useState(false)
  const [msg, setMsg]                 = useState('')
  const [expanded, setExpanded]       = useState<Set<string>>(new Set())

  useEffect(() => {
    fetch('/api/kelas').then(r=>r.json()).then((k:Kelas[])=>{
      setKelasList(k); if(k.length) selectKelas(k[0])
    })
  },[])

  const selectKelas = async (k: Kelas) => {
    setActiveKelas(k); setLoading(true); setEditing(null)
    const sr = await fetch(`/api/santri?kelas_id=${k.id}`)
    const sl: Santri[] = await sr.json()
    const withP = await Promise.all(sl.map(async s => {
      const pr = await fetch(`/api/prestasi?santri_id=${s.id}`)
      return { ...s, prestasi: await pr.json() as Prestasi[] }
    }))
    setSantriData(withP)
    setExpanded(new Set(sl.map(s=>s.id)))
    setLoading(false)
  }

  const toggle = (id:string) => setExpanded(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n})

  const hapus = async (id:string) => {
    if(!confirm('Hapus entri ini?')||!activeKelas) return
    await fetch(`/api/prestasi?id=${id}`,{method:'DELETE'})
    setMsg('✓ Dihapus'); await selectKelas(activeKelas)
    setTimeout(()=>setMsg(''),2000)
  }

  const saveEdit = async () => {
    if(!editing||!activeKelas) return
    setSaving(true)
    const res = await fetch(`/api/prestasi?id=${editing.id}`,{
      method:'PATCH', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        kegiatan_sekolah: editForm.kegiatan_sekolah,
        kegiatan_pondok:  editForm.kegiatan_pondok,
        prestasi_tahfidz: editForm.prestasi_tahfidz,
        prestasi_non_tahfidz: editForm.prestasi_non_tahfidz,
        progres_pribadi:  editForm.progres_pribadi,
      })
    })
    if(res.ok){ setEditing(null); setMsg('✓ Disimpan'); await selectKelas(activeKelas) }
    setSaving(false); setTimeout(()=>setMsg(''),2000)
  }

  const totalEntri = santriData.reduce((a,s)=>a+s.prestasi.length,0)
  const sudahIsi   = santriData.filter(s=>s.prestasi.length>0).length

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold">Kelola Prestasi</h1>
          <p className="text-sm text-gray-400 mt-0.5">Edit atau hapus data yang diinput musyrif</p>
        </div>
        <div className="flex items-center gap-3">
          {msg && <span className="text-sm text-emerald-600 font-medium">{msg}</span>}
          {activeKelas && (
            <a href={`/admin/achievement?kelas_id=${activeKelas.id}`}
              className="btn btn-primary text-sm">🏆 Cetak Achievement</a>
          )}
        </div>
      </div>

      {/* Tab kelas */}
      <div className="flex gap-1 mb-0 border-b border-gray-200 overflow-x-auto">
        {kelasList.map(k=>(
          <button key={k.id} onClick={()=>selectKelas(k)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors
              ${activeKelas?.id===k.id ? 'bg-white border border-b-white border-gray-200 text-purple-700 -mb-px' : 'text-gray-500 hover:text-gray-700'}`}>
            {k.nama}
          </button>
        ))}
      </div>

      <div className="bg-white border border-gray-100 rounded-b-xl rounded-tr-xl">
        {!loading && santriData.length>0 && (
          <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-4 flex-wrap">
            <span className="text-xs text-gray-500">{santriData.length} santri</span>
            <span className="text-xs text-emerald-600 font-medium">{sudahIsi} sudah ada data</span>
            <span className="text-xs text-gray-400">{totalEntri} total entri</span>
            <div className="ml-auto flex gap-2">
              <button onClick={()=>setExpanded(new Set(santriData.map(s=>s.id)))} className="text-xs text-gray-400 hover:text-gray-600">Buka semua</button>
              <span className="text-gray-200">|</span>
              <button onClick={()=>setExpanded(new Set())} className="text-xs text-gray-400 hover:text-gray-600">Tutup semua</button>
            </div>
          </div>
        )}
        {loading && <div className="py-16 text-center text-sm text-gray-400">Memuat...</div>}
        <div className="divide-y divide-gray-50">
          {santriData.map(santri=>{
            const isOpen = expanded.has(santri.id)
            return (
              <div key={santri.id}>
                <button onClick={()=>toggle(santri.id)}
                  className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-left group">
                  <span className="w-7 h-7 rounded-full bg-purple-50 text-purple-600 text-xs font-semibold flex items-center justify-center flex-shrink-0">{santri.no_urut}</span>
                  <span className="font-medium text-gray-800 text-sm flex-1">{santri.nama}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${santri.prestasi.length>0?'bg-emerald-50 text-emerald-600':'bg-gray-100 text-gray-400'}`}>
                    {santri.prestasi.length>0?`${santri.prestasi.length} entri`:'Belum ada'}
                  </span>
                  <span className="text-gray-300 text-sm">{isOpen?'▲':'▼'}</span>
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 bg-gray-50/50">
                    {santri.prestasi.length===0 && <p className="text-xs text-gray-400 py-3 pl-10">Belum ada data.</p>}
                    {santri.prestasi.map((p,pi)=>(
                      <div key={p.id} className="ml-10 mt-3 bg-white border border-gray-100 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs text-gray-400">Entri {pi+1} · {new Date(p.updated_at).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})}</span>
                          <div className="flex gap-2">
                            <button onClick={()=>{setEditing(p);setEditForm({...p})}} className="btn text-xs py-0.5 px-2">Edit</button>
                            <button onClick={()=>hapus(p.id)} className="btn btn-danger text-xs py-0.5 px-2">Hapus</button>
                          </div>
                        </div>
                        {editing?.id===p.id ? (
                          <div className="space-y-2">
                            {FIELDS.map(f=>(
                              <div key={f.key}>
                                <label className="label">{f.label}</label>
                                <textarea rows={2} className="input text-sm"
                                  value={(editForm as any)[f.key]||''}
                                  onChange={e=>setEditForm(prev=>({...prev,[f.key]:e.target.value}))}/>
                              </div>
                            ))}
                            <div className="flex gap-2 pt-1">
                              <button onClick={saveEdit} disabled={saving} className="btn btn-primary text-xs py-1">{saving?'Menyimpan...':'Simpan'}</button>
                              <button onClick={()=>setEditing(null)} className="btn text-xs py-1">Batal</button>
                            </div>
                          </div>
                        ):(
                          <div className="space-y-2">
                            {/* Tahfidz */}
                            {p.prestasi_tahfidz?.length>0 && (
                              <div className="rounded-lg border p-2.5 bg-amber-50 text-amber-700 border-amber-100">
                                <p className="text-xs font-bold uppercase opacity-60 mb-1">Prestasi Tahfidz</p>
                                <p className="text-xs">{p.prestasi_tahfidz.map(j=>`Juz ${j.juz} (${JUZ_LEVEL_LABEL[j.level]})`).join(' · ')}</p>
                              </div>
                            )}
                            {/* Non Tahfidz */}
                            {p.prestasi_non_tahfidz?.length>0 && (
                              <div className="rounded-lg border p-2.5 bg-emerald-50 text-emerald-700 border-emerald-100">
                                <p className="text-xs font-bold uppercase opacity-60 mb-1">Prestasi Non Tahfidz</p>
                                {p.prestasi_non_tahfidz.map((n,ni)=>(
                                  <p key={ni} className="text-xs">• {n.juara} – {n.cabang} ({n.penyelenggara}, {n.bulan_tahun})</p>
                                ))}
                              </div>
                            )}
                            {/* Fields lain */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {FIELDS.map(f=>{
                                const val=(p as any)[f.key]; if(!val) return null
                                return (
                                  <div key={f.key} className={`rounded-lg border p-2.5 ${COLOR_MAP[f.color]}`}>
                                    <p className="text-xs font-bold uppercase opacity-60 mb-1">{f.label}</p>
                                    <p className="text-xs whitespace-pre-line leading-relaxed">{val}</p>
                                  </div>
                                )
                              })}
                            </div>
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
