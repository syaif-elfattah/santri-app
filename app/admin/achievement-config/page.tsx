'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

type Config = {
  // Teks
  nama_institusi: string; judul: string; subjudul: string; label_diberikan: string
  teks_motivasi_1: string; teks_motivasi_2: string; teks_motivasi_3: string
  label_motivasi: string; teks_ayat: string; referensi_ayat: string
  // Warna kolom
  warna_tahfidz: string; warna_non_tahfidz: string; warna_kegiatan: string; warna_progres: string
  // Warna teks
  warna_judul: string; warna_inst: string; warna_subjudul: string
  warna_label: string; warna_nama: string; warna_kelas: string
  warna_motivasi_title: string; warna_motivasi: string
  warna_ayat: string; warna_ayat_ref: string; warna_tanggal: string
  // Ukuran
  ukuran_logo: number; ukuran_judul: number; ukuran_inst: number
  ukuran_subjudul: number; ukuran_label: number; ukuran_nama: number
  ukuran_kelas: number; ukuran_hdr_kolom: number; ukuran_sub_kolom: number
  ukuran_isi: number; ukuran_total_label: number; ukuran_total_num: number
  ukuran_motivasi_title: number; ukuran_motivasi: number
  ukuran_ayat: number; ukuran_tanggal: number
  // Bold
  bold_judul: boolean; bold_inst: boolean; bold_subjudul: boolean
  bold_label: boolean; bold_nama: boolean; bold_kelas: boolean
  bold_isi: boolean; bold_motivasi: boolean; bold_ayat: boolean; bold_tanggal: boolean
  // Tampilkan
  tampil_progres: boolean; tampil_motivasi: boolean; tampil_ayat: boolean
}

const DEFAULT: Config = {
  nama_institusi:"Pondok Pesantren Ma'ahid Kudus", judul:"ACHIEVEMENT",
  subjudul:"Catatan Prestasi & Keaktifan Santri", label_diberikan:"Diberikan Kepada",
  teks_motivasi_1:"Ayah & Bunda, setiap doa yang kalian panjatkan adalah investasi terbaik yang tidak ternilai. Teruslah hadir dan mendukung.",
  teks_motivasi_2:"Terima kasih, Ayah & Bunda, telah mempercayakan ananda kepada kami. Setiap langkah kecil adalah buah dari doa kalian.",
  teks_motivasi_3:"Ayah & Bunda yang luar biasa, prestasi bukan hanya angka — tetapi karakter yang tumbuh dan hati yang semakin dekat kepada Allah.",
  label_motivasi:"✦ Pesan untuk Ayah & Bunda ✦",
  teks_ayat:"Dan barangsiapa yang bersungguh-sungguh di jalan Kami, maka Kami akan tunjukkan kepada mereka jalan-jalan Kami.",
  referensi_ayat:"(QS. Al-'Ankabut: 69)",
  warna_tahfidz:"#b45309", warna_non_tahfidz:"#065f46",
  warna_kegiatan:"#1e40af", warna_progres:"#7c3aed",
  warna_judul:"#1a3a2a", warna_inst:"#374151", warna_subjudul:"#6b7280",
  warna_label:"#9ca3af", warna_nama:"#1a5c3a", warna_kelas:"#4b5563",
  warna_motivasi_title:"#92400e", warna_motivasi:"#374151",
  warna_ayat:"#6b7280", warna_ayat_ref:"#b45309", warna_tanggal:"#374151",
  ukuran_logo:80, ukuran_judul:28, ukuran_inst:9,
  ukuran_subjudul:8, ukuran_label:7, ukuran_nama:21,
  ukuran_kelas:10, ukuran_hdr_kolom:8, ukuran_sub_kolom:7,
  ukuran_isi:9, ukuran_total_label:7, ukuran_total_num:19,
  ukuran_motivasi_title:7, ukuran_motivasi:8,
  ukuran_ayat:7, ukuran_tanggal:8,
  bold_judul:true, bold_inst:true, bold_subjudul:false,
  bold_label:true, bold_nama:true, bold_kelas:false,
  bold_isi:false, bold_motivasi:false, bold_ayat:false, bold_tanggal:true,
  tampil_progres:true, tampil_motivasi:true, tampil_ayat:true
}

// ── Komponen helper ──────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card mb-5">
      <p className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">{title}</p>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function ColorRow({ label, colorKey, cfg, set }: {
  label: string; colorKey: keyof Config; cfg: Config; set: (k: keyof Config, v: any) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-600 w-40 flex-shrink-0">{label}</span>
      <input type="color" value={cfg[colorKey] as string}
        onChange={e => set(colorKey, e.target.value)}
        className="w-10 h-8 rounded border border-gray-200 cursor-pointer p-0.5 flex-shrink-0"/>
      <input className="input flex-1 font-mono text-xs py-1" value={cfg[colorKey] as string}
        onChange={e => set(colorKey, e.target.value)} placeholder="#000000"/>
    </div>
  )
}

function SizeRow({ label, sizeKey, boldKey, cfg, set, min=6, max=40 }: {
  label: string; sizeKey: keyof Config; boldKey?: keyof Config
  cfg: Config; set: (k: keyof Config, v: any) => void; min?: number; max?: number
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-600 w-40 flex-shrink-0">{label}</span>
      <input type="range" min={min} max={max} step={1}
        value={cfg[sizeKey] as number}
        onChange={e => set(sizeKey, parseInt(e.target.value))}
        className="flex-1 accent-emerald-600"/>
      <input type="number" min={min} max={max} step={1}
        value={cfg[sizeKey] as number}
        onChange={e => set(sizeKey, parseInt(e.target.value)||min)}
        className="input w-14 text-center text-xs py-1"/>
      <span className="text-xs text-gray-400 w-4">pt</span>
      {boldKey && (
        <button onClick={() => set(boldKey, !cfg[boldKey])}
          className={`px-2 py-1 rounded text-xs font-bold border transition-colors flex-shrink-0
            ${cfg[boldKey] ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-400 border-gray-200'}`}>
          B
        </button>
      )}
    </div>
  )
}

function Toggle({ label, k, cfg, set }: { label: string; k: keyof Config; cfg: Config; set: (k: keyof Config, v: any) => void }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div className={`w-10 h-5 rounded-full transition-colors relative flex-shrink-0 ${cfg[k] ? 'bg-emerald-500' : 'bg-gray-200'}`}
        onClick={() => set(k, !cfg[k])}>
        <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${cfg[k] ? 'left-5' : 'left-0.5'}`}/>
      </div>
      <span className={`text-sm ${cfg[k] ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>{label}</span>
    </label>
  )
}

export default function AchievementConfigPage() {
  const [cfg, setCfg]         = useState<Config>(DEFAULT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState('')

  useEffect(() => {
    fetch('/api/achievement-config').then(r => r.json()).then(d => {
      setCfg({ ...DEFAULT, ...d }); setLoading(false)
    })
  }, [])

  const set = (k: keyof Config, v: any) => setCfg(p => ({ ...p, [k]: v }))

  const save = async () => {
    setSaving(true)
    try {
      // Sanitasi: pastikan semua ukuran adalah integer (bukan float)
      const ukuranKeys = [
        'ukuran_logo','ukuran_judul','ukuran_inst','ukuran_subjudul','ukuran_label',
        'ukuran_nama','ukuran_kelas','ukuran_hdr_kolom','ukuran_sub_kolom','ukuran_isi',
        'ukuran_total_label','ukuran_total_num','ukuran_motivasi_title','ukuran_motivasi',
        'ukuran_ayat','ukuran_tanggal'
      ]
      const sanitized = { ...cfg }
      ukuranKeys.forEach(k => {
        (sanitized as any)[k] = Math.round(Number((sanitized as any)[k]) || 0)
      })
      const res = await fetch('/api/achievement-config', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sanitized)
      })
      if (res.ok) {
        setMsg('✓ Tersimpan')
      } else if (res.status === 401) {
        setMsg('Session habis — silakan login ulang')
        setTimeout(() => { window.location.href = '/admin' }, 2000)
      } else {
        const d = await res.json().catch(() => ({}))
        setMsg('Error: ' + (d.error || res.statusText || 'Gagal menyimpan'))
      }
    } catch {
      setMsg('Error: Tidak bisa terhubung ke server')
    }
    setSaving(false)
    setTimeout(() => setMsg(''), 4000)
  }

  if (loading) return <div className="py-16 text-center text-gray-400">Memuat...</div>

  return (
    <div className="max-w-2xl">
      {/* Sticky header */}
      <div className="flex items-center justify-between mb-6 sticky top-0 bg-gray-50 py-3 z-10 -mx-1 px-1">
        <div>
          <h1 className="text-xl font-semibold">Desain Achievement</h1>
          <p className="text-xs text-gray-400 mt-0.5">Edit teks, warna, ukuran, dan ketebalan semua elemen sertifikat</p>
        </div>
        <div className="flex items-center gap-2">
          {msg && <span className={`text-sm font-medium ${msg.startsWith('✓') ? 'text-emerald-600' : 'text-red-500'}`}>{msg}</span>}
          <Link href="/admin/achievement" className="btn text-sm">👁 Preview</Link>
          <button onClick={() => { if(confirm('Reset ke default?')) setCfg(DEFAULT) }} className="btn text-sm">Reset</button>
          <button onClick={save} disabled={saving} className="btn btn-primary text-sm">
            {saving ? 'Menyimpan...' : '💾 Simpan'}
          </button>
        </div>
      </div>

      {/* LOGO */}
      <Section title="🖼 Logo">
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-600 w-40 flex-shrink-0">Ukuran logo</span>
          <input type="range" min={40} max={120} step={4}
            value={cfg.ukuran_logo} onChange={e => set('ukuran_logo', parseInt(e.target.value))}
            className="flex-1 accent-emerald-600"/>
          <input type="number" min={40} max={120}
            value={cfg.ukuran_logo} onChange={e => set('ukuran_logo', parseInt(e.target.value)||40)}
            className="input w-14 text-center text-xs py-1"/>
          <span className="text-xs text-gray-400 w-4">px</span>
          <div className="w-5"/>
        </div>
      </Section>

      {/* HEADER */}
      <Section title="📝 Header — Teks & Ukuran">
        <div>
          <label className="label">Nama Institusi</label>
          <input className="input" value={cfg.nama_institusi} onChange={e => set('nama_institusi', e.target.value)}/>
        </div>
        <SizeRow label="Ukuran nama institusi" sizeKey="ukuran_inst" boldKey="bold_inst" cfg={cfg} set={set}/>
        <ColorRow label="Warna nama institusi" colorKey="warna_inst" cfg={cfg} set={set}/>
        <div className="border-t border-gray-100 pt-3">
          <label className="label">Judul Utama</label>
          <input className="input" value={cfg.judul} onChange={e => set('judul', e.target.value)}/>
        </div>
        <SizeRow label="Ukuran judul" sizeKey="ukuran_judul" boldKey="bold_judul" cfg={cfg} set={set} max={50}/>
        <ColorRow label="Warna judul" colorKey="warna_judul" cfg={cfg} set={set}/>
        <div className="border-t border-gray-100 pt-3">
          <label className="label">Subjudul</label>
          <input className="input" value={cfg.subjudul} onChange={e => set('subjudul', e.target.value)}/>
        </div>
        <SizeRow label="Ukuran subjudul" sizeKey="ukuran_subjudul" boldKey="bold_subjudul" cfg={cfg} set={set}/>
        <ColorRow label="Warna subjudul" colorKey="warna_subjudul" cfg={cfg} set={set}/>
      </Section>

      {/* NAMA SANTRI */}
      <Section title="👤 Nama Santri">
        <div>
          <label className="label">Label "Diberikan Kepada"</label>
          <input className="input" value={cfg.label_diberikan} onChange={e => set('label_diberikan', e.target.value)}/>
        </div>
        <SizeRow label="Ukuran label" sizeKey="ukuran_label" boldKey="bold_label" cfg={cfg} set={set}/>
        <ColorRow label="Warna label" colorKey="warna_label" cfg={cfg} set={set}/>
        <div className="border-t border-gray-100 pt-3"/>
        <SizeRow label="Ukuran nama santri" sizeKey="ukuran_nama" boldKey="bold_nama" cfg={cfg} set={set} max={40}/>
        <ColorRow label="Warna nama santri" colorKey="warna_nama" cfg={cfg} set={set}/>
        <div className="border-t border-gray-100 pt-3"/>
        <SizeRow label="Ukuran kelas" sizeKey="ukuran_kelas" boldKey="bold_kelas" cfg={cfg} set={set}/>
        <ColorRow label="Warna kelas" colorKey="warna_kelas" cfg={cfg} set={set}/>
      </Section>

      {/* KOLOM PRESTASI */}
      <Section title="📊 Kolom Prestasi">
        <SizeRow label="Ukuran header kolom" sizeKey="ukuran_hdr_kolom" cfg={cfg} set={set}/>
        <SizeRow label="Ukuran sub-header kolom" sizeKey="ukuran_sub_kolom" cfg={cfg} set={set}/>
        <SizeRow label="Ukuran isi kolom" sizeKey="ukuran_isi" boldKey="bold_isi" cfg={cfg} set={set} min={6} max={14}/>
        <div className="border-t border-gray-100 pt-3">
          <p className="text-xs font-medium text-gray-500 mb-2">Warna header kolom</p>
          <div className="space-y-2">
            <ColorRow label="🕌 Tahfidz Al-Qur'an" colorKey="warna_tahfidz" cfg={cfg} set={set}/>
            <ColorRow label="🏆 Prestasi Non Tahfidz" colorKey="warna_non_tahfidz" cfg={cfg} set={set}/>
            <ColorRow label="⭐ Participated Activities" colorKey="warna_kegiatan" cfg={cfg} set={set}/>
            <ColorRow label="🌱 Progres Pribadi" colorKey="warna_progres" cfg={cfg} set={set}/>
          </div>
        </div>
        <div className="border-t border-gray-100 pt-3">
          <p className="text-xs font-medium text-gray-500 mb-2">Kotak total tahfidz</p>
          <SizeRow label="Ukuran label total" sizeKey="ukuran_total_label" cfg={cfg} set={set}/>
          <SizeRow label="Ukuran angka total" sizeKey="ukuran_total_num" cfg={cfg} set={set} max={40}/>
        </div>
      </Section>

      {/* PESAN ORANG TUA */}
      <Section title="💌 Pesan untuk Orang Tua">
        <div>
          <label className="label">Label judul pesan</label>
          <input className="input" value={cfg.label_motivasi} onChange={e => set('label_motivasi', e.target.value)}/>
        </div>
        <SizeRow label="Ukuran label pesan" sizeKey="ukuran_motivasi_title" cfg={cfg} set={set}/>
        <ColorRow label="Warna label pesan" colorKey="warna_motivasi_title" cfg={cfg} set={set}/>
        <div className="border-t border-gray-100 pt-3">
          {['teks_motivasi_1','teks_motivasi_2','teks_motivasi_3'].map((k,i) => (
            <div key={k} className={i > 0 ? 'mt-2' : ''}>
              <label className="label">Pesan {i+1}</label>
              <textarea className="input" rows={2} value={cfg[k as keyof Config] as string}
                onChange={e => set(k as keyof Config, e.target.value)}/>
            </div>
          ))}
        </div>
        <SizeRow label="Ukuran teks pesan" sizeKey="ukuran_motivasi" boldKey="bold_motivasi" cfg={cfg} set={set}/>
        <ColorRow label="Warna teks pesan" colorKey="warna_motivasi" cfg={cfg} set={set}/>
      </Section>

      {/* AYAT */}
      <Section title="📖 Ayat & Tanggal">
        <div>
          <label className="label">Teks ayat</label>
          <textarea className="input" rows={2} value={cfg.teks_ayat} onChange={e => set('teks_ayat', e.target.value)}/>
        </div>
        <div>
          <label className="label">Referensi ayat</label>
          <input className="input" value={cfg.referensi_ayat} onChange={e => set('referensi_ayat', e.target.value)}/>
        </div>
        <SizeRow label="Ukuran teks ayat" sizeKey="ukuran_ayat" boldKey="bold_ayat" cfg={cfg} set={set}/>
        <ColorRow label="Warna teks ayat" colorKey="warna_ayat" cfg={cfg} set={set}/>
        <ColorRow label="Warna referensi ayat" colorKey="warna_ayat_ref" cfg={cfg} set={set}/>
        <div className="border-t border-gray-100 pt-3"/>
        <SizeRow label="Ukuran tanggal" sizeKey="ukuran_tanggal" boldKey="bold_tanggal" cfg={cfg} set={set}/>
        <ColorRow label="Warna tanggal" colorKey="warna_tanggal" cfg={cfg} set={set}/>
      </Section>

      {/* TAMPILKAN/SEMBUNYIKAN */}
      <Section title="👁 Tampilkan / Sembunyikan Bagian">
        <Toggle label="🌱 Progres Pribadi" k="tampil_progres" cfg={cfg} set={set}/>
        <Toggle label="💌 Kotak Pesan untuk Orang Tua" k="tampil_motivasi" cfg={cfg} set={set}/>
        <Toggle label="📖 Ayat / Kutipan Footer" k="tampil_ayat" cfg={cfg} set={set}/>
      </Section>

      <div className="flex gap-3 pb-10">
        <button onClick={save} disabled={saving} className="btn btn-primary flex-1">
          {saving ? 'Menyimpan...' : '💾 Simpan Semua'}
        </button>
        <Link href="/admin/achievement" className="btn">👁 Preview</Link>
      </div>
    </div>
  )
}
