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

// ─── OPSI CEPAT DETAIL ───────────────────────────────────────
const OPSI_KEGIATAN_SEK = [
  // OSIS & Organisasi
  { group: 'OSIS & Organisasi', items: [
    'Ketua OSIS', 'Wakil Ketua OSIS', 'Sekretaris OSIS', 'Bendahara OSIS',
    'Anggota Bidang Dakwah OSIS', 'Anggota Bidang Pendidikan OSIS',
    'Anggota Bidang Olahraga OSIS', 'Anggota Bidang Seni & Budaya OSIS',
    'Anggota Bidang Humas OSIS',
  ]},
  { group: 'Ekstrakurikuler', items: [
    'Aktif Mengikuti Ekstra Pramuka', 'Aktif Mengikuti Ekstra PMR',
    'Aktif Mengikuti Ekstra Paskibra', 'Aktif Mengikuti Ekstra KIR',
    'Aktif Mengikuti Ekstra Futsal', 'Aktif Mengikuti Ekstra Basket',
    'Aktif Mengikuti Ekstra Musik / Nasyid', 'Aktif Mengikuti Ekstra Karate',
  ]},
  { group: 'Akademik', items: [
    'Aktif di Tim Olimpiade Matematika', 'Aktif di Tim Olimpiade IPA',
    'Aktif di Tim Olimpiade Bahasa Arab', 'Aktif di Tim Olimpiade Bahasa Inggris',
    'Aktif di Tim Debat', 'Aktif di Kelompok Belajar',
  ]},
]

const OPSI_KEGIATAN_PON = [
  { group: 'Organisasi Pondok', items: [
    'Ketua OSIS Pondok', 'Wakil Ketua OSIS Pondok',
    'Sekretaris OSIS Pondok', 'Bendahara OSIS Pondok',
    'Ketua Kamar / Komplek', 'Wakil Ketua Kamar',
    'Anggota Bidang Dakwah Pondok', 'Anggota Bidang Keamanan Pondok',
    'Anggota Bidang Kebersihan Pondok',
  ]},
  { group: 'Kegiatan Keagamaan', items: [
    'Aktif Mengikuti Halaqah Tahfidz', 'Aktif Mengikuti Kajian Kitab Kuning',
    'Aktif di Grup Tilawah Al-Qur\'an', 'Aktif Mengikuti Kelas Bahasa Arab',
    'Aktif Mengikuti Kelas Bahasa Inggris', 'Aktif di Grup Nasyid Pondok',
    'Aktif Mengikuti Ta\'lim Pagi', 'Aktif Mengikuti Ta\'lim Malam',
  ]},
  { group: 'Kepemimpinan & Sosial', items: [
    'Aktif sebagai Tutor Teman Sebaya', 'Aktif di Panitia Acara Pondok',
    'Aktif sebagai MC / Pembawa Acara', 'Aktif di Tim Keamanan Pondok',
  ]},
]

const OPSI_PROGRES = [
  { group: 'Ibadah & Spiritual', items: [
    'Rutin menambah hafalan Al-Qur\'an setiap hari',
    'Konsisten sholat berjamaah tepat waktu',
    'Rajin mengikuti wirid dan doa bersama',
    'Mulai aktif membaca Al-Qur\'an setelah sholat',
    'Terbiasa sholat sunnah rawatib',
  ]},
  { group: 'Akademik & Belajar', items: [
    'Belajar lebih rutin dan terstruktur',
    'Meningkat nilai akademik secara konsisten',
    'Lebih aktif bertanya kepada ustadz/guru',
    'Rajin mencatat dan mengulang pelajaran',
    'Mulai terbiasa belajar mandiri tanpa diingatkan',
  ]},
  { group: 'Karakter & Sikap', items: [
    'Lebih disiplin dalam keseharian pondok',
    'Lebih percaya diri tampil di depan umum',
    'Aktif membantu teman yang kesulitan',
    'Sikap sopan dan hormat kepada ustadz meningkat',
    'Lebih bertanggung jawab atas tugas dan amanah',
    'Berkurang penggunaan gadget di luar waktu yang ditentukan',
    'Lebih mandiri dalam mengurus keperluan pribadi',
  ]},
  { group: 'Sosial & Lingkungan', items: [
    'Mudah bergaul dan diterima di lingkungan pondok',
    'Aktif menjaga kebersihan kamar dan lingkungan',
    'Lebih peduli terhadap sesama santri',
    'Menjadi teladan bagi teman sekamar',
  ]},
]

const JUZ_LEVEL_LABEL: Record<number,string> = { 1:'Full Juz', 2:'3/4 Juz', 3:'1/2 Juz', 4:'1/4 Juz' }
const JUZ_LEVEL_COLOR: Record<number,string> = {
  1:'bg-emerald-500 text-white',
  2:'bg-emerald-400 text-white',
  3:'bg-emerald-300 text-emerald-900',
  4:'bg-emerald-100 text-emerald-700',
}

const FIELD_LABELS: { key: keyof Prestasi; label: string; color: string }[] = [
  { key:'kegiatan_sekolah', label:'Kegiatan Sekolah', color:'blue' },
  { key:'kegiatan_pondok',  label:'Kegiatan Pondok',  color:'purple' },
  { key:'progres_pribadi',  label:'Progres Pribadi',  color:'rose' },
]
const COLOR_MAP: Record<string,string> = {
  blue:  'bg-blue-50 text-blue-700 border-blue-100',
  purple:'bg-purple-50 text-purple-700 border-purple-100',
  rose:  'bg-rose-50 text-rose-700 border-rose-100',
}

// ─── ListInput ────────────────────────────────────────────────
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

// ─── GroupedTagPicker ─────────────────────────────────────────
function GroupedTagPicker({
  groups, selected, onToggle, color='emerald'
}: {
  groups: { group:string; items:string[] }[]
  selected: string[]
  onToggle: (t:string)=>void
  color?: 'emerald'|'purple'
}) {
  const [openGroup, setOpenGroup] = useState<string|null>(groups[0]?.group||null)
  const colorSel = color==='purple'
    ? 'bg-purple-600 border-purple-600 text-white shadow-md shadow-purple-200'
    : 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-200'
  const colorHover = color==='purple' ? 'hover:border-purple-300' : 'hover:border-emerald-300'

  return (
    <div className="space-y-2">
      {groups.map(g=>(
        <div key={g.group} className="border border-gray-100 rounded-xl overflow-hidden">
          <button onClick={()=>setOpenGroup(openGroup===g.group?null:g.group)}
            className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors text-left">
            <span className="text-xs font-semibold text-gray-600">{g.group}</span>
            <span className="text-gray-400 text-xs">{openGroup===g.group?'▲':'▼'}</span>
          </button>
          {openGroup===g.group && (
            <div className="p-2 flex flex-wrap gap-1.5">
              {g.items.map(t=>(
                <button key={t} onClick={()=>onToggle(t)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all
                    ${selected.includes(t) ? colorSel : `bg-white border-gray-200 text-gray-500 ${colorHover}`}`}>
                  {selected.includes(t)?'✓ ':''}{t}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ─── JuzPicker ────────────────────────────────────────────────
function JuzPicker({ value, onChange }: { value: JuzEntry[]; onChange:(v:JuzEntry[])=>void }) {
  const getLevel = (juz:number) => value.find(j=>j.juz===juz)?.level || 0
  const handleClick = (juz:number) => {
    const cur=getLevel(juz); const next=cur>=4?0:cur+1
    if(next===0) onChange(value.filter(j=>j.juz!==juz))
    else { const exists=value.find(j=>j.juz===juz); if(exists) onChange(value.map(j=>j.juz===juz?{...j,level:next}:j)); else onChange([...value,{juz,level:next}]) }
  }
  const totalJuz = value.reduce((sum,j)=>{ const m={1:1,2:0.75,3:0.5,4:0.25}; return sum+(m[j.level as keyof typeof m]||0) },0)

  return (
    <div>
      <div className="grid grid-cols-10 gap-1 mb-3">
        {Array.from({length:30},(_,i)=>i+1).map(juz=>{
          const lv=getLevel(juz)
          return (
            <button key={juz} onClick={()=>handleClick(juz)} title={lv?JUZ_LEVEL_LABEL[lv]:'Belum dipilih'}
              className={`aspect-square rounded-lg text-xs font-bold border transition-all select-none
                ${lv?JUZ_LEVEL_COLOR[lv]+' border-transparent shadow-sm':'bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200'}`}>
              {juz}
            </button>
          )
        })}
      </div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {[1,2,3,4].map(lv=>(
          <span key={lv} className={`text-xs px-2 py-0.5 rounded-full ${JUZ_LEVEL_COLOR[lv]}`}>{JUZ_LEVEL_LABEL[lv]}</span>
        ))}
        <span className="text-xs text-gray-400">· Klik berulang untuk ganti tingkat · Klik 4× = reset</span>
      </div>
      {value.length>0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
          <p className="text-xs text-emerald-800 font-semibold">Total hafalan: {totalJuz % 1 === 0 ? totalJuz : totalJuz.toFixed(2)} Juz</p>
          <p className="text-xs text-emerald-600 mt-0.5">{value.sort((a,b)=>a.juz-b.juz).map(j=>`Juz ${j.juz}${j.level!==1?' ('+JUZ_LEVEL_LABEL[j.level]+')':''}`).join(', ')}</p>
        </div>
      )}
    </div>
  )
}

// ─── NonTahfidzInput ──────────────────────────────────────────
const emptyNonTahfidz = (): NonTahfidz => ({ juara:'', cabang:'', penyelenggara:'', bulan_tahun:'' })

function NonTahfidzInput({ value, onChange }: { value: NonTahfidz[]; onChange:(v:NonTahfidz[])=>void }) {
  const addRow = () => onChange([...value, emptyNonTahfidz()])
  const updateRow = (idx:number, field:keyof NonTahfidz, val:string) => onChange(value.map((r,i)=>i===idx?{...r,[field]:val}:r))
  const removeRow = (idx:number) => onChange(value.filter((_,i)=>i!==idx))
  return (
    <div className="space-y-3">
      {value.map((row,idx)=>(
        <div key={idx} className="relative bg-gray-50 border border-gray-200 rounded-xl p-3 group">
          <button onClick={()=>removeRow(idx)} className="absolute top-2 right-2 text-red-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all text-lg leading-none">×</button>
          <div className="grid grid-cols-2 gap-2">
            {([['juara','Juara','Juara 1'],['cabang','Cabang Lomba','Olimpiade Nahwu'],['penyelenggara','Penyelenggara','Universitas Negeri Semarang'],['bulan_tahun','Bulan & Tahun','Januari 2026']] as const).map(([field,label,ph])=>(
              <div key={field}>
                <label className="text-xs text-gray-400 font-medium">{label}</label>
                <input className="w-full bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  placeholder={ph} value={(row as any)[field]} onChange={e=>updateRow(idx,field as keyof NonTahfidz,e.target.value)}/>
              </div>
            ))}
          </div>
        </div>
      ))}
      <button onClick={addRow} className="w-full py-2 border border-dashed border-emerald-300 rounded-xl text-sm text-emerald-600 hover:bg-emerald-50 transition-colors">
        + Tambah Prestasi Non Tahfidz
      </button>
    </div>
  )
}

// ─── Helper ───────────────────────────────────────────────────
type FormData = {
  kegiatan_sekolah: string; kegiatan_pondok: string
  prestasi_tahfidz: JuzEntry[]; prestasi_non_tahfidz: NonTahfidz[]
  progres_pribadi: string
}
const emptyForm = (): FormData => ({ kegiatan_sekolah:'', kegiatan_pondok:'', prestasi_tahfidz:[], prestasi_non_tahfidz:[], progres_pribadi:'' })
const addBullets = (text:string) => text.split('\n').map(l=>l.trim()).filter(Boolean).map(l=>l.startsWith('•')?l:`• ${l}`).join('\n')
const buildField = (tags:string[], manual:string) => {
  const tagLines=tags.map(t=>`• ${t}`)
  const manualLines=manual.split('\n').map(l=>l.replace(/^•\s*/,'').trim()).filter(Boolean).map(l=>`• ${l}`)
  return [...tagLines,...manualLines].join('\n')
}

// ─── Tab Rekap ────────────────────────────────────────────────
function RekapTab({ kelas }: { kelas: Kelas }) {
  const [data, setData]         = useState<SantriWithPrestasi[]>([])
  const [loading, setLoading]   = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [editing, setEditing]   = useState<Prestasi|null>(null)
  const [editForm, setEditForm] = useState<Partial<Prestasi>>({})
  const [saving, setSaving]     = useState(false)
  const [msg, setMsg]           = useState('')

  const loadData = () => {
    setLoading(true)
    fetch(`/api/santri?kelas_id=${kelas.id}`).then(r=>r.json()).then(async(sl:Santri[])=>{
      const wp=await Promise.all(sl.map(async s=>{ const pr=await fetch(`/api/prestasi?santri_id=${s.id}`); return {...s,prestasi:await pr.json() as Prestasi[]} }))
      setData(wp); setExpanded(new Set(sl.map(s=>s.id))); setLoading(false)
    })
  }

  useEffect(()=>{ loadData() },[kelas.id])

  const toggle=(id:string)=>setExpanded(p=>{const n=new Set(p);n.has(id)?n.delete(id):n.add(id);return n})
  const sudahIsi=data.filter(s=>s.prestasi.length>0).length

  const startEdit = (p: Prestasi) => { setEditing(p); setEditForm({...p}) }

  const saveEdit = async () => {
    if(!editing) return
    setSaving(true)
    const res = await fetch(`/api/prestasi?id=${editing.id}`, {
      method: 'PATCH',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({
        kegiatan_sekolah:     editForm.kegiatan_sekolah,
        kegiatan_pondok:      editForm.kegiatan_pondok,
        prestasi_tahfidz:     editForm.prestasi_tahfidz,
        prestasi_non_tahfidz: editForm.prestasi_non_tahfidz,
        progres_pribadi:      editForm.progres_pribadi,
      })
    })
    if(res.ok) {
      setEditing(null)
      setMsg('✓ Data berhasil diperbarui')
      loadData()
    } else {
      setMsg('Gagal menyimpan')
    }
    setSaving(false)
    setTimeout(()=>setMsg(''),3000)
  }

  if(loading) return <div className="py-16 text-center text-sm text-gray-400">Memuat data rekap...</div>
  return (
    <div>
      <div className="flex gap-4 px-1 mb-4 flex-wrap items-center">
        <span className="text-xs text-gray-500">{data.length} santri</span>
        <span className="text-xs text-emerald-600 font-medium">{sudahIsi} sudah ada data</span>
        {msg && <span className={`text-xs font-medium ${msg.startsWith('✓')?'text-emerald-600':'text-red-500'}`}>{msg}</span>}
        <div className="ml-auto flex gap-3">
          <button onClick={()=>setExpanded(new Set(data.map(s=>s.id)))} className="text-xs text-gray-400 hover:text-gray-600">Buka semua</button>
          <button onClick={()=>setExpanded(new Set())} className="text-xs text-gray-400 hover:text-gray-600">Tutup semua</button>
        </div>
      </div>
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-50 shadow-sm">
        {data.map(santri=>{
          const isOpen=expanded.has(santri.id)
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
              {isOpen&&(
                <div className="px-4 pb-4 bg-gray-50/50">
                  {santri.prestasi.length===0&&<p className="text-xs text-gray-400 py-3 pl-10">Belum ada data.</p>}
                  {santri.prestasi.map((p,pi)=>(
                    <div key={p.id} className="ml-10 mt-3 bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                      {/* Header entri */}
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs text-gray-400">Entri {pi+1} · {new Date(p.updated_at).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})}</p>
                        {editing?.id===p.id ? (
                          <div className="flex gap-2">
                            <button onClick={saveEdit} disabled={saving}
                              className="text-xs bg-emerald-600 text-white px-3 py-1 rounded-lg font-medium disabled:opacity-50">
                              {saving?'Menyimpan...':'Simpan'}
                            </button>
                            <button onClick={()=>setEditing(null)}
                              className="text-xs border border-gray-200 px-3 py-1 rounded-lg text-gray-500">
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button onClick={()=>startEdit(p)}
                            className="text-xs border border-emerald-200 text-emerald-600 px-3 py-1 rounded-lg hover:bg-emerald-50 transition-colors font-medium">
                            ✏️ Edit
                          </button>
                        )}
                      </div>

                      {/* Mode edit */}
                      {editing?.id===p.id ? (
                        <div className="space-y-3">
                          {/* Kegiatan Sekolah */}
                          <div>
                            <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Kegiatan Sekolah</p>
                            <textarea rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-400"
                              value={editForm.kegiatan_sekolah||''} onChange={e=>setEditForm(f=>({...f,kegiatan_sekolah:e.target.value}))}/>
                          </div>
                          {/* Kegiatan Pondok */}
                          <div>
                            <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Kegiatan Pondok</p>
                            <textarea rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-400"
                              value={editForm.kegiatan_pondok||''} onChange={e=>setEditForm(f=>({...f,kegiatan_pondok:e.target.value}))}/>
                          </div>
                          {/* Tahfidz - JuzPicker */}
                          <div>
                            <p className="text-[10px] font-bold uppercase text-gray-400 mb-2">Prestasi Tahfidz</p>
                            <JuzPicker
                              value={editForm.prestasi_tahfidz||[]}
                              onChange={v=>setEditForm(f=>({...f,prestasi_tahfidz:v}))}/>
                          </div>
                          {/* Non Tahfidz */}
                          <div>
                            <p className="text-[10px] font-bold uppercase text-gray-400 mb-2">Prestasi Non Tahfidz</p>
                            <NonTahfidzInput
                              value={editForm.prestasi_non_tahfidz||[]}
                              onChange={v=>setEditForm(f=>({...f,prestasi_non_tahfidz:v}))}/>
                          </div>
                          {/* Progres Pribadi */}
                          <div>
                            <p className="text-[10px] font-bold uppercase text-gray-400 mb-1">Progres Pribadi</p>
                            <textarea rows={3} className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-400"
                              value={editForm.progres_pribadi||''} onChange={e=>setEditForm(f=>({...f,progres_pribadi:e.target.value}))}/>
                          </div>
                        </div>
                      ) : (
                        /* Mode tampil */
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {p.prestasi_tahfidz?.length>0&&(
                            <div className="rounded-lg border p-2.5 bg-amber-50 text-amber-700 border-amber-100">
                              <p className="text-[10px] font-bold uppercase opacity-60 mb-1">Prestasi Tahfidz</p>
                              <p className="text-xs">{p.prestasi_tahfidz.map(j=>`Juz ${j.juz} (${JUZ_LEVEL_LABEL[j.level]})`).join(', ')}</p>
                            </div>
                          )}
                          {p.prestasi_non_tahfidz?.length>0&&(
                            <div className="rounded-lg border p-2.5 bg-emerald-50 text-emerald-700 border-emerald-100">
                              <p className="text-[10px] font-bold uppercase opacity-60 mb-1">Prestasi Non Tahfidz</p>
                              {p.prestasi_non_tahfidz.map((n,ni)=><p key={ni} className="text-xs">• {n.juara} – {n.cabang}</p>)}
                            </div>
                          )}
                          {FIELD_LABELS.map(f=>{ const val=(p as any)[f.key]; if(!val) return null; return (
                            <div key={f.key as string} className={`rounded-lg border p-2.5 ${COLOR_MAP[f.color]}`}>
                              <p className="text-[10px] font-bold uppercase opacity-60 mb-1">{f.label}</p>
                              <p className="text-xs whitespace-pre-line leading-relaxed">{val}</p>
                            </div>
                          )})}
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
  )
}

// ─── Tab Input ────────────────────────────────────────────────
function InputTab({ kelas }: { kelas: Kelas }) {
  const [santriList, setSantriList]   = useState<Santri[]>([])
  const [selectedSantri, setSelected] = useState<Santri|null>(null)
  const [form, setForm]               = useState<FormData>(emptyForm())
  const [tagsSek, setTagsSek]         = useState<string[]>([])
  const [tagsPon, setTagsPon]         = useState<string[]>([])
  const [tagsProgres, setTagsProgres] = useState<string[]>([])
  const [saving, setSaving]           = useState(false)
  const [saved, setSaved]             = useState(false)
  const [error, setError]             = useState('')
  const [tahunAjaranId, setTahunAjaranId] = useState<string|null>(null)

  useEffect(()=>{
    fetch(`/api/santri?kelas_id=${kelas.id}`).then(r=>r.json()).then(setSantriList)
    // Ambil tahun ajaran aktif
    fetch('/api/tahun-ajaran?aktif=1').then(r=>r.json()).then((d:any[])=>{
      if(d && d.length > 0) setTahunAjaranId(d[0].id)
    })
  },[kelas.id])

  const selectSantri=(s:Santri)=>{ setSelected(s); setForm(emptyForm()); setTagsSek([]); setTagsPon([]); setTagsProgres([]); setSaved(false); setError('') }
  const toggleSek=(t:string)=>setTagsSek(p=>p.includes(t)?p.filter(x=>x!==t):[...p,t])
  const togglePon=(t:string)=>setTagsPon(p=>p.includes(t)?p.filter(x=>x!==t):[...p,t])
  const toggleProgres=(t:string)=>setTagsProgres(p=>p.includes(t)?p.filter(x=>x!==t):[...p,t])

  const handleSave=async()=>{
    if(!selectedSantri) return
    setSaving(true); setError('')
    try {
      const progresAll=[...tagsProgres.map(t=>`• ${t}`),...addBullets(form.progres_pribadi).split('\n').filter(Boolean)].join('\n')
      const res=await fetch('/api/prestasi',{
        method:'POST', headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          santri_id:            selectedSantri.id,
          tahun_ajaran_id:      tahunAjaranId,
          kegiatan_sekolah:     buildField(tagsSek, form.kegiatan_sekolah),
          kegiatan_pondok:      buildField(tagsPon, form.kegiatan_pondok),
          prestasi_tahfidz:     form.prestasi_tahfidz,
          prestasi_non_tahfidz: form.prestasi_non_tahfidz,
          progres_pribadi:      progresAll,
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
      {santriList.length===0&&<p className="py-10 text-center text-sm text-gray-400">Belum ada santri di kelas ini</p>}
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
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">1. Kegiatan di Sekolah</p>
        <p className="text-xs text-gray-400 mb-3">Pilih dari daftar atau tambah sendiri</p>
        <GroupedTagPicker groups={OPSI_KEGIATAN_SEK} selected={tagsSek} onToggle={toggleSek} color="emerald"/>
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-2">Tambah kegiatan lainnya</p>
          <ListInput value={form.kegiatan_sekolah} onChange={v=>setForm(f=>({...f,kegiatan_sekolah:v}))} placeholder="Ketik kegiatan lain..."/>
        </div>
      </div>

      {/* 2. Kegiatan Pondok */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">2. Kegiatan di Pondok</p>
        <p className="text-xs text-gray-400 mb-3">Pilih dari daftar atau tambah sendiri</p>
        <GroupedTagPicker groups={OPSI_KEGIATAN_PON} selected={tagsPon} onToggle={togglePon} color="purple"/>
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-2">Tambah kegiatan lainnya</p>
          <ListInput value={form.kegiatan_pondok} onChange={v=>setForm(f=>({...f,kegiatan_pondok:v}))} placeholder="Ketik kegiatan lain..."/>
        </div>
      </div>

      {/* 3. Prestasi Tahfidz */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">3. Prestasi Tahfidz</p>
        <p className="text-xs text-gray-400 mb-4">Klik angka juz · Klik lagi untuk ganti tingkat hafalan</p>
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
        <p className="text-xs text-gray-400 mb-3">Pilih yang sesuai atau ceritakan sendiri</p>
        <GroupedTagPicker groups={OPSI_PROGRES} selected={tagsProgres} onToggle={toggleProgres} color="emerald"/>
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-400 mb-2">Tambah catatan lainnya</p>
          <ListInput value={form.progres_pribadi} onChange={v=>setForm(f=>({...f,progres_pribadi:v}))} placeholder="Ceritakan perkembangan santri selama 1 tahun..."/>
        </div>
      </div>

      {error&&<div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">{error}</div>}
      <div className="flex gap-3 pb-10">
        <button onClick={handleSave} disabled={saving} className="flex-1 bg-emerald-600 text-white py-3 rounded-2xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-700 disabled:opacity-50 transition-all">
          {saving?'Menyimpan...':'Simpan Data'}
        </button>
        <button onClick={()=>setSelected(null)} className="px-6 bg-white border border-gray-200 text-gray-500 py-3 rounded-2xl font-bold hover:bg-gray-50 transition-all">Batal</button>
      </div>
    </div>
  )
}

// ─── Halaman Utama ────────────────────────────────────────────
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
                className={`px-5 py-2.5 rounded-xl text-sm font-bold border whitespace-nowrap transition-all
                  ${activeKelas?.id===k.id?'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100':'bg-white border-gray-200 text-gray-500 hover:border-emerald-300'}`}>
                {k.nama}
              </button>
            ))}
          </div>
        </div>
        {activeKelas&&(
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
