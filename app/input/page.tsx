'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

type Kelas  = { id: string; nama: string }
type Santri = { id: string; nama: string; no_urut: number }
type Prestasi = {
  id: string; santri_id: string
  kegiatan_sekolah: string; kegiatan_pondok: string
  prestasi_tahfidz: JuzEntry[]; prestasi_non_tahfidz: NonTahfidz[]
  progres_pribadi: string; updated_at: string
}
type JuzEntry   = { juz: number; level: number }
type NonTahfidz = { juara: string; cabang: string; penyelenggara: string; bulan_tahun: string }
type SantriWithPrestasi = Santri & { prestasi: Prestasi[] }

const KEGIATAN_SEK = ['OSIS','Pramuka','PMR','Futsal','Paskibra','KIR','Basket']
const KEGIATAN_PON = ['Tahfidz','Kajian kitab','OSIS Pondok','Nasyid','Ketua kamar','Tilawah','Bahasa Arab']
const PROGRES_TAGS = ['Lebih disiplin','Lebih percaya diri','Aktif membantu teman','Rajin berjamaah','Sopan kepada ustadz','Mengurangi gadget']

const JUZ_LEVEL_LABEL: Record<number,string> = { 1:'Full Juz', 2:'3/4 Juz', 3:'1/2 Juz', 4:'1/4 Juz' }
const JUZ_LEVEL_COLOR: Record<number,string> = {
  1:'bg-emerald-500 text-white',
  2:'bg-emerald-400 text-white',
  3:'bg-emerald-300 text-emerald-900',
  4:'bg-emerald-100 text-emerald-700'
}

const FIELD_LABELS: { key: keyof Prestasi; label: string; color: string }[] = [
  { key:'kegiatan_sekolah', label:'Kegiatan Sekolah', color:'blue' },
  { key:'kegiatan_pondok',  label:'Kegiatan Pondok',  color:'purple' },
  { key:'progres_pribadi',  label:'Progres Pribadi',  color:'rose' },
]
const COLOR_MAP: Record<string,string> = {
  blue:'bg-blue-50 text-blue-700 border-blue-100',
  purple:'bg-purple-50 text-purple-700 border-purple-100',
  rose:'bg-rose-50 text-rose-700 border-rose-100',
}

// ── ListInput ────────────────────────────────────────────────
function ListInput({ value, onChange, placeholder }: { value:string; onChange:(v:string)=>void; placeholder?:string }) {
  const toItems = (v:string) => v ? v.split('\n').map(l=>l.replace(/^•\s*/,'')) : ['']
  const fromItems = (items:string[]) => items.join('\n')
  const items = toItems(value)
  const refs = useRef<(HTMLInputElement|null)[]>([])

  const update = (idx:number, val:string) => { const n=[...items]; n[idx]=val; onChange(fromItems(n)) }
  const addItem = () => onChange(fromItems([...items,'']))
  const removeItem = (idx:number) => { const n=items.filter((_,i)=>i!==idx); onChange(fromItems(n.length?n:[''])) }
  const handleKeyDown = (e:React.KeyboardEvent, idx:number) => {
    if(e.key==='Enter'){ e.preventDefault(); const n=[...items]; n.splice(idx+1,0,''); onChange(fromItems(n)); setTimeout(()=>refs.current[idx+1]?.focus(),30) }
    if(e.key==='Backspace'&&items[idx]===''&&items.length>1){ e.preventDefault(); removeItem(idx); setTimeout(()=>refs.current[Math.max(0,idx-1)]?.focus(),30) }
  }

  return (
    <div className="space-y-1.5">
      {items.map((item,idx)=>(
        <div key={idx} className="flex items-center gap-2 group">
          <span className="text-gray-300 text-sm flex-shrink-0 w-4 text-center">•</span>
          <input ref={el=>{refs.current[idx]=el}}
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            value={item} placeholder={idx===0?placeholder:'Tambah lagi...'}
            onChange={e=>update(idx,e.target.value)} onKeyDown={e=>handleKeyDown(e,idx)}/>
          {items.length>1 && <button onClick={()=>removeItem(idx)} className="text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all text-lg leading-none flex-shrink-0 w-5 text-center">×</button>}
        </div>
      ))}
      <button onClick={addItem} className="text-xs text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1 pl-6 mt-1">+ Tambah item</button>
    </div>
  )
}

// ── Juz Picker ───────────────────────────────────────────────
function JuzPicker({ value, onChange }: { value: JuzEntry[]; onChange:(v:JuzEntry[])=>void }) {
  const getLevel = (juz:number) => value.find(j=>j.juz===juz)?.level || 0

  const handleClick = (juz:number) => {
    const cur = getLevel(juz)
    const next = cur >= 4 ? 0 : cur + 1
    if(next===0) onChange(value.filter(j=>j.juz!==juz))
    else {
      const exists = value.find(j=>j.juz===juz)
      if(exists) onChange(value.map(j=>j.juz===juz?{...j,level:next}:j))
      else onChange([...value,{juz,level:next}])
    }
  }

  return (
    <div>
      <div className="grid grid-cols-10 gap-1 mb-2">
        {Array.from({length:30},(_,i)=>i+1).map(juz=>{
          const lv = getLevel(juz)
          return (
            <button key={juz} onClick={()=>handleClick(juz)} title={lv?JUZ_LEVEL_LABEL[lv]:'Belum'}
              className={`aspect-square rounded-lg text-xs font-bold border transition-all select-none
                ${lv ? JUZ_LEVEL_COLOR[lv]+' border-transparent shadow-sm' : 'bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200'}`}>
              {juz}
            </button>
          )
        })}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-2 mt-1">
        <span className="text-xs text-gray-400">Klik untuk pilih tingkat hafalan:</span>
        {[1,2,3,4].map(lv=>(
          <span key={lv} className={`text-xs px-2 py-0.5 rounded-full ${JUZ_LEVEL_COLOR[lv]}`}>{JUZ_LEVEL_LABEL[lv]}</span>
        ))}
        <span className="text-xs text-gray-400">· Klik 4x = reset</span>
      </div>
      {value.length>0 && (
        <div className="mt-2 text-xs text-emerald-700 font-medium">
          Terpilih: {value.sort((a,b)=>a.juz-b.juz).map(j=>`Juz ${j.juz}${JUZ_LEVEL_LABEL[j.level]!=='Full Juz'?' ('+JUZ_LEVEL_LABEL[j.level]+')':''}`).join(', ')}
        </div>
      )}
    </div>
  )
}

// ── Non Tahfidz Form ─────────────────────────────────────────
const emptyNonTahfidz = (): NonTahfidz => ({ juara:'', cabang:'', penyelenggara:'', bulan_tahun:'' })

function NonTahfidzInput({ value, onChange }: { value: NonTahfidz[]; onChange:(v:NonTahfidz[])=>void }) {
  const addRow = () => onChange([...value, emptyNonTahfidz()])
  const updateRow = (idx:number, field:keyof NonTahfidz, val:string) =>
    onChange(value.map((r,i)=>i===idx?{...r,[field]:val}:r))
  const removeRow = (idx:number) => onChange(value.filter((_,i)=>i!==idx))

  return (
    <div className="space-y-3">
      {value.map((row,idx)=>(
        <div key={idx} className="relative bg-gray-50 border border-gray-200 rounded-xl p-3 group">
          <button onClick={()=>removeRow(idx)}
            className="absolute top-2 right-2 text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all text-lg leading-none">×</button>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-400 font-medium">Juara</label>
              <input className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                placeholder="Juara 1" value={row.juara} onChange={e=>updateRow(idx,'juara',e.target.value)}/>
            </div>
            <div>
              <label className="text-xs text-gray-400 font-medium">Cabang Lomba</label>
              <input className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                placeholder="Olimpiade Nahwu" value={row.cabang} onChange={e=>updateRow(idx,'cabang',e.target.value)}/>
            </div>
            <div>
              <label className="text-xs text-gray-400 font-medium">Penyelenggara</label>
              <input className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                placeholder="Universitas Negeri Semarang" value={row.penyelenggara} onChange={e=>updateRow(idx,'penyelenggara',e.target.value)}/>
            </div>
            <div>
              <label className="text-xs text-gray-400 font-medium">Bulan & Tahun</label>
              <input className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                placeholder="Januari 2026" value={row.bulan_tahun} onChange={e=>updateRow(idx,'bulan_tahun',e.target.value)}/>
            </div>
          </div>
        </div>
      ))}
      <button onClick={addRow}
        className="w-full py-2 border border-dashed border-emerald-300 rounded-xl text-sm text-emerald-600 hover:bg-emerald-50 transition-colors">
        + Tambah Prestasi Non Tahfidz
      </button>
    </div>
  )
}

// ── FormData ─────────────────────────────────────────────────
type FormData = {
  kegiatan_sekolah: string; kegiatan_pondok: string
  prestasi_tahfidz: JuzEntry[]; prestasi_non_tahfidz: NonTahfidz[]
  progres_pribadi: string
}
const emptyForm = (): FormData => ({
  kegiatan_sekolah:'', kegiatan_pondok:'',
  prestasi_tahfidz:[], prestasi_non_tahfidz:[], progres_pribadi:''
})
const addBullets = (text:string) => text.split('\n').map(l=>l.trim()).filter(Boolean).map(l=>l.startsWith('•')?l:`• ${l}`).join('\n')
const buildField = (tags:string[], manual:string) => {
  const tagLines = tags.map(t=>`• ${t}`)
  const manualLines = manual.split('\n').map(l=>l.replace(/^•\s*/,'').trim()).filter(Boolean).map(l=>`• ${l}`)
  return [...tagLines,...manualLines].join('\n')
}

// ── Tab Rekap ────────────────────────────────────────────────
function RekapTab({ kelas }: { kelas: Kelas }) {
  const [data, setData]         = useState<SantriWithPrestasi[]>([])
  const [loading, setLoading]   = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(()=>{
    setLoading(true)
    fetch(`/api/santri?kelas_id=${kelas.id}`).then(r=>r.json()).then(async(sl:Santri[])=>{
      const wp = await Promise.all(sl.map(async s=>{
        const pr = await fetch(`/api/prestasi?santri_id=${s.id}`)
        return {...s, prestasi: await pr.json() as Prestasi[]}
      }))
      setData(wp); setExpanded(new Set(sl.map(s=>s.id))); setLoading(false)
    })
  },[kelas.id])

  const toggle = (id:string) => setExpanded(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n})
  const sudahIsi = data.filter(s=>s.prestasi.length>0).length

  if(loading) return <div className="py-16 text-center text-sm text-gray-400">Memuat data rekap...</div>

  return (
    <div>
      <div className="flex gap-4 px-1 mb-4 flex-wrap items-center">
        <span className="text-xs text-gray-500">{data.length} santri</span>
        <span className="text-xs text-emerald-600 font-medium">{sudahIsi} sudah ada data</span>
        <div className="ml-auto flex gap-3">
          <button onClick={()=>setExpanded(new Set(data.map(s=>s.id)))} className="text-xs text-gray-400 hover:text-gray-600">Buka semua</button>
          <button onClick={()=>setExpanded(new Set())} className="text-xs text-gray-400 hover:text-gray-600">Tutup semua</button>
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-50 shadow-sm">
        {data.map(santri=>{
          const isOpen = expanded.has(santri.id)
          return (
            <div key={santri.id}>
              <button onClick={()=>toggle(santri.id)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left group">
                <span className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 text-xs font-semibold flex items-center justify-center flex-shrink-0">{santri.no_urut}</span>
                <span className="font-medium text-gray-800 text-sm flex-1">{santri.nama}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${santri.prestasi.length>0?'bg-emerald-50 text-emerald-600':'bg-gray-100 text-gray-400'}`}>
                  {santri.prestasi.length>0?`${santri.prestasi.length} entri`:'Belum ada'}
                </span>
                <span className="text-gray-300 text-xs">{isOpen?'▲':'▼'}</span>
              </button>
              {isOpen && (
                <div className="px-4 pb-4 bg-gray-50/50">
                  {santri.prestasi.length===0 && <p className="text-xs text-gray-400 py-3 pl-10">Belum ada data.</p>}
                  {santri.prestasi.map((p,pi)=>(
                    <div key={p.id} className="ml-10 mt-3 bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                      <p className="text-xs text-gray-400 mb-3">Entri {pi+1} · {new Date(p.updated_at).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {p.prestasi_tahfidz?.length>0 && (
                          <div className="rounded-lg border p-2.5 bg-amber-50 text-amber-700 border-amber-100">
                            <p className="text-[10px] font-bold uppercase opacity-60 mb-1">Prestasi Tahfidz</p>
                            <p className="text-xs">{p.prestasi_tahfidz.map(j=>`Juz ${j.juz} (${JUZ_LEVEL_LABEL[j.level]})`).join(', ')}</p>
                          </div>
                        )}
                        {p.prestasi_non_tahfidz?.length>0 && (
                          <div className="rounded-lg border p-2.5 bg-emerald-50 text-emerald-700 border-emerald-100">
                            <p className="text-[10px] font-bold uppercase opacity-60 mb-1">Prestasi Non Tahfidz</p>
                            {p.prestasi_non_tahfidz.map((n,ni)=><p key={ni} className="text-xs">• {n.juara} – {n.cabang}</p>)}
                          </div>
                        )}
                        {FIELD_LABELS.map(f=>{
                          const val=(p as any)[f.key]; if(!val) return null
                          return (
                            <div key={f.key as string} className={`rounded-lg border p-2.5 ${COLOR_MAP[f.color]}`}>
                              <p className="text-[10px] font-bold uppercase opacity-60 mb-1">{f.label}</p>
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
      </div>
    </div>
  )
}

// ── Tab Input ────────────────────────────────────────────────
function InputTab({ kelas }: { kelas: Kelas }) {
  const [santriList, setSantriList]   = useState<Santri[]>([])
  const [selectedSantri, setSelected] = useState<Santri|null>(null)
  const [form, setForm]               = useState<FormData>(emptyForm())
  const [tagsSek, setTagsSek]         = useState<string[]>([])
  const [tagsPon, setTagsPon]         = useState<string[]>([])
  const [saving, setSaving]           = useState(false)
  const [saved, setSaved]             = useState(false)
  const [error, setError]             = useState('')

  useEffect(()=>{ fetch(`/api/santri?kelas_id=${kelas.id}`).then(r=>r.json()).then(setSantriList) },[kelas.id])

  const selectSantri = (s:Santri) => { setSelected(s); setForm(emptyForm()); setTagsSek([]); setTagsPon([]); setSaved(false); setError('') }
  const toggleSek = (t:string) => setTagsSek(p=>p.includes(t)?p.filter(x=>x!==t):[...p,t])
  const togglePon = (t:string) => setTagsPon(p=>p.includes(t)?p.filter(x=>x!==t):[...p,t])

  const handleSave = async () => {
    if(!selectedSantri) return
    setSaving(true); setError('')
    try {
      const res = await fetch('/api/prestasi',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          santri_id:           selectedSantri.id,
          kegiatan_sekolah:    buildField(tagsSek, form.kegiatan_sekolah),
          kegiatan_pondok:     buildField(tagsPon, form.kegiatan_pondok),
          prestasi_tahfidz:    form.prestasi_tahfidz,
          prestasi_non_tahfidz:form.prestasi_non_tahfidz,
          progres_pribadi:     addBullets(form.progres_pribadi),
        })
      })
      if(!res.ok) throw new Error((await res.json()).error)
      setSaved(true)
    } catch(e:any){ setError(e.message) }
    finally{ setSaving(false) }
  }

  if(saved&&selectedSantri) return (
    <div className="bg-white border border-gray-200 rounded-2xl text-center py-10 px-6 shadow-sm">
      <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">✅</div>
      <h3 className="font-bold text-gray-900 mb-1">Data Berhasil Disimpan!</h3>
      <p className="text-sm text-gray-500 mb-8">{selectedSantri.nama}</p>
      <div className="flex flex-col gap-3 max-w-xs mx-auto">
        <button onClick={()=>{ const idx=santriList.findIndex(s=>s.id===selectedSantri.id); const next=santriList[idx+1]; if(next) selectSantri(next); else{setSelected(null);setSaved(false)} }}
          className="w-full bg-emerald-600 text-white py-2.5 rounded-xl font-semibold hover:bg-emerald-700 transition-colors">Santri Berikutnya →</button>
        <button onClick={()=>{setSelected(null);setSaved(false)}} className="w-full bg-gray-100 text-gray-600 py-2.5 rounded-xl font-semibold hover:bg-gray-200 transition-colors">Kembali ke Daftar</button>
      </div>
    </div>
  )

  if(!selectedSantri) return (
    <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-50 overflow-hidden shadow-sm">
      {santriList.map(s=>(
        <button key={s.id} onClick={()=>selectSantri(s)} className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left group">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-700 flex-shrink-0">{s.no_urut}</div>
          <span className="text-sm font-medium text-gray-700 group-hover:text-emerald-700 flex-1">{s.nama}</span>
          <span className="text-gray-300 group-hover:text-emerald-400">→</span>
        </button>
      ))}
      {santriList.length===0 && <p className="py-10 text-center text-sm text-gray-400">Belum ada santri di kelas ini</p>}
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Header santri */}
      <div className="flex items-center gap-4 p-4 bg-emerald-600 rounded-2xl text-white shadow-lg shadow-emerald-900/10">
        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold flex-shrink-0">{selectedSantri.nama.charAt(0)}</div>
        <div className="flex-1"><p className="font-bold leading-tight">{selectedSantri.nama}</p><p className="text-xs text-emerald-100 opacity-80">{kelas.nama} · Nomor Urut {selectedSantri.no_urut}</p></div>
        <button onClick={()=>setSelected(null)} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors">Ganti</button>
      </div>

      {/* 1. Kegiatan Sekolah */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">1. Kegiatan Sekolah</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {KEGIATAN_SEK.map(t=>(
              <button key={t} onClick={()=>toggleSek(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${tagsSek.includes(t)?'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-200':'bg-white border-gray-200 text-gray-500 hover:border-emerald-300'}`}>
                {tagsSek.includes(t)?'✓ ':'+  '}{t}
              </button>
            ))}
          </div>
          <ListInput value={form.kegiatan_sekolah} onChange={v=>setForm(f=>({...f,kegiatan_sekolah:v}))} placeholder="Tambah kegiatan sekolah lainnya..."/>
        </div>
        <div className="pt-4 border-t border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">2. Kegiatan Pondok</p>
          <div className="flex flex-wrap gap-2 mb-3">
            {KEGIATAN_PON.map(t=>(
              <button key={t} onClick={()=>togglePon(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${tagsPon.includes(t)?'bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-200':'bg-white border-gray-200 text-gray-500 hover:border-purple-300'}`}>
                {tagsPon.includes(t)?'✓ ':'+  '}{t}
              </button>
            ))}
          </div>
          <ListInput value={form.kegiatan_pondok} onChange={v=>setForm(f=>({...f,kegiatan_pondok:v}))} placeholder="Tambah kegiatan pondok lainnya..."/>
        </div>
      </div>

      {/* 3. Prestasi Tahfidz */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">3. Prestasi Tahfidz</p>
        <p className="text-xs text-gray-400 mb-4">Klik angka juz untuk memilih · Klik lagi untuk ganti tingkat hafalan</p>
        <JuzPicker value={form.prestasi_tahfidz} onChange={v=>setForm(f=>({...f,prestasi_tahfidz:v}))}/>
      </div>

      {/* 4. Prestasi Non Tahfidz */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">4. Prestasi Non Tahfidz</p>
        <NonTahfidzInput value={form.prestasi_non_tahfidz} onChange={v=>setForm(f=>({...f,prestasi_non_tahfidz:v}))}/>
      </div>

      {/* 5. Progres Pribadi */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">5. Progres Pribadi Selama 1 Tahun</p>
        <p className="text-xs text-gray-400 mb-3">Ceritakan perkembangan karakter dan perilaku santri</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {PROGRES_TAGS.map(t=>(
            <button key={t} onClick={()=>setForm(f=>({...f,progres_pribadi:f.progres_pribadi.trim()?f.progres_pribadi+'\n'+t:t}))}
              className="px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-600 hover:bg-emerald-50 hover:border-emerald-200 transition-colors">+  {t}</button>
          ))}
        </div>
        <ListInput value={form.progres_pribadi} onChange={v=>setForm(f=>({...f,progres_pribadi:v}))} placeholder="Ceritakan perkembangan santri selama 1 tahun..."/>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">{error}</div>}
      <div className="flex gap-3 pb-10">
        <button onClick={handleSave} disabled={saving} className="flex-1 bg-emerald-600 text-white py-3 rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 disabled:opacity-50 transition-all">
          {saving?'Menyimpan...':'Simpan Data'}
        </button>
        <button onClick={()=>setSelected(null)} className="px-6 bg-white border border-gray-200 text-gray-500 py-3 rounded-2xl font-bold hover:bg-gray-50 transition-all">Batal</button>
      </div>
    </div>
  )
}

// ── Halaman Utama ────────────────────────────────────────────
export default function InputPage() {
  const [kelasList, setKelasList]     = useState<Kelas[]>([])
  const [activeKelas, setActiveKelas] = useState<Kelas|null>(null)
  const [activeTab, setActiveTab]     = useState<'input'|'rekap'>('input')

  useEffect(()=>{ fetch('/api/kelas').then(r=>r.json()).then((k:Kelas[])=>{ setKelasList(k); if(k.length) setActiveKelas(k[0]) }) },[])

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-4 flex items-center justify-between sticky top-0 z-20">
        <Link href="/" className="text-gray-400 hover:text-emerald-600 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
        </Link>
        <span className="text-sm font-bold text-gray-800 tracking-tight">E-PRESTASI SANTRI</span>
        <div className="w-5"/>
      </nav>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1">Pilih Kelas Anda</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {kelasList.map(k=>(
              <button key={k.id} onClick={()=>setActiveKelas(k)}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold border whitespace-nowrap transition-all ${activeKelas?.id===k.id?'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100':'bg-white border-gray-200 text-gray-500 hover:border-emerald-300'}`}>
                {k.nama}
              </button>
            ))}
          </div>
        </div>
        {activeKelas && (
          <div className="space-y-6">
            <div className="flex bg-gray-200/50 p-1 rounded-xl">
              <button onClick={()=>setActiveTab('input')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab==='input'?'bg-white text-emerald-700 shadow-sm':'text-gray-500 hover:text-gray-700'}`}>✏️ INPUT DATA</button>
              <button onClick={()=>setActiveTab('rekap')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${activeTab==='rekap'?'bg-white text-emerald-700 shadow-sm':'text-gray-500 hover:text-gray-700'}`}>📋 REKAP KELAS</button>
            </div>
            {activeTab==='input'?<InputTab kelas={activeKelas}/>:<RekapTab kelas={activeKelas}/>}
          </div>
        )}
      </div>
    </div>
  )
}
