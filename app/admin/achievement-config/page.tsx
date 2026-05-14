'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

type Config = {
  nama_institusi: string; judul: string; subjudul: string; label_diberikan: string
  teks_motivasi_1: string; teks_motivasi_2: string; teks_motivasi_3: string
  label_motivasi: string; teks_ayat: string; referensi_ayat: string
  warna_tahfidz: string; warna_non_tahfidz: string; warna_kegiatan: string; warna_progres: string
  ukuran_judul: number; ukuran_nama: number; ukuran_isi: number; ukuran_logo: number
  tampil_progres: boolean; tampil_motivasi: boolean; tampil_ayat: boolean
}

const DEFAULT: Config = {
  nama_institusi:'Pondok Pesantren Ma\'ahid Kudus', judul:'ACHIEVEMENT',
  subjudul:'Catatan Prestasi & Keaktifan Santri', label_diberikan:'Diberikan Kepada',
  teks_motivasi_1:'Ayah & Bunda, setiap doa yang kalian panjatkan adalah investasi terbaik yang tidak ternilai. Teruslah hadir dan mendukung — kehadiran kalian adalah energi terbesar bagi perjalanan ananda.',
  teks_motivasi_2:'Terima kasih, Ayah & Bunda, telah mempercayakan ananda kepada kami. Setiap langkah kecil yang ananda tempuh adalah buah dari kasih sayang dan doa kalian yang tiada putus.',
  teks_motivasi_3:'Ayah & Bunda yang luar biasa, prestasi bukan hanya angka dan piala — tetapi karakter yang tumbuh, akhlak yang terbentuk, dan hati yang semakin dekat kepada Allah.',
  label_motivasi:'✦ Pesan untuk Ayah & Bunda ✦',
  teks_ayat:'Dan barangsiapa yang bersungguh-sungguh di jalan Kami, maka Kami akan tunjukkan kepada mereka jalan-jalan Kami.',
  referensi_ayat:'(QS. Al-\'Ankabut: 69)',
  warna_tahfidz:'#b45309', warna_non_tahfidz:'#065f46',
  warna_kegiatan:'#1e40af', warna_progres:'#7c3aed',
  ukuran_judul:28, ukuran_nama:21, ukuran_isi:9, ukuran_logo:80,
  tampil_progres:true, tampil_motivasi:true, tampil_ayat:true
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card mb-5">
      <p className="text-sm font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">{title}</p>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {hint && <p className="text-xs text-gray-400 mb-1">{hint}</p>}
      {children}
    </div>
  )
}

export default function AchievementConfigPage() {
  const [cfg, setCfg]     = useState<Config>(DEFAULT)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [msg, setMsg]         = useState('')

  useEffect(() => {
    fetch('/api/achievement-config').then(r => r.json()).then(d => {
      setCfg({ ...DEFAULT, ...d })
      setLoading(false)
    })
  }, [])

  const set = (k: keyof Config, v: any) => setCfg(p => ({ ...p, [k]: v }))

  const save = async () => {
    setSaving(true)
    const res = await fetch('/api/achievement-config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cfg)
    })
    if (res.ok) setMsg('✓ Pengaturan disimpan')
    else setMsg('Error menyimpan')
    setSaving(false)
    setTimeout(() => setMsg(''), 3000)
  }

  const reset = () => {
    if (!confirm('Reset semua pengaturan ke default?')) return
    setCfg(DEFAULT)
  }

  if (loading) return <div className="py-16 text-center text-gray-400">Memuat pengaturan...</div>

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold">Desain Achievement</h1>
          <p className="text-sm text-gray-400 mt-0.5">Edit teks, warna, dan ukuran sertifikat achievement</p>
        </div>
        <div className="flex items-center gap-3">
          {msg && <span className={`text-sm font-medium ${msg.startsWith('Error') ? 'text-red-600' : 'text-emerald-600'}`}>{msg}</span>}
          <Link href="/admin/achievement" className="btn text-sm">👁 Preview</Link>
          <button onClick={reset} className="btn text-sm">Reset Default</button>
          <button onClick={save} disabled={saving} className="btn btn-primary text-sm">
            {saving ? 'Menyimpan...' : '💾 Simpan'}
          </button>
        </div>
      </div>

      {/* TEKS HEADER */}
      <Section title="📝 Teks Header">
        <Field label="Nama Institusi">
          <input className="input" value={cfg.nama_institusi}
            onChange={e => set('nama_institusi', e.target.value)}/>
        </Field>
        <Field label="Judul Utama" hint="Biasanya 'ACHIEVEMENT' — akan ditampilkan besar di tengah">
          <input className="input" value={cfg.judul}
            onChange={e => set('judul', e.target.value)}/>
        </Field>
        <Field label="Subjudul" hint="Ditampilkan di bawah judul, italic">
          <input className="input" value={cfg.subjudul}
            onChange={e => set('subjudul', e.target.value)}/>
        </Field>
        <Field label="Label 'Diberikan Kepada'">
          <input className="input" value={cfg.label_diberikan}
            onChange={e => set('label_diberikan', e.target.value)}/>
        </Field>
      </Section>

      {/* TEKS MOTIVASI */}
      <Section title="💌 Pesan untuk Orang Tua">
        <Field label="Label judul pesan" hint="Teks di atas kotak motivasi">
          <input className="input" value={cfg.label_motivasi}
            onChange={e => set('label_motivasi', e.target.value)}/>
        </Field>
        <Field label="Pesan 1 (untuk santri pertama, ke-4, ke-7, dst)">
          <textarea className="input" rows={3} value={cfg.teks_motivasi_1}
            onChange={e => set('teks_motivasi_1', e.target.value)}/>
        </Field>
        <Field label="Pesan 2 (untuk santri ke-2, ke-5, ke-8, dst)">
          <textarea className="input" rows={3} value={cfg.teks_motivasi_2}
            onChange={e => set('teks_motivasi_2', e.target.value)}/>
        </Field>
        <Field label="Pesan 3 (untuk santri ke-3, ke-6, ke-9, dst)">
          <textarea className="input" rows={3} value={cfg.teks_motivasi_3}
            onChange={e => set('teks_motivasi_3', e.target.value)}/>
        </Field>
      </Section>

      {/* TEKS AYAT */}
      <Section title="📖 Ayat / Kutipan Footer">
        <Field label="Teks ayat">
          <textarea className="input" rows={2} value={cfg.teks_ayat}
            onChange={e => set('teks_ayat', e.target.value)}/>
        </Field>
        <Field label="Referensi ayat">
          <input className="input" value={cfg.referensi_ayat}
            onChange={e => set('referensi_ayat', e.target.value)}/>
        </Field>
      </Section>

      {/* WARNA */}
      <Section title="🎨 Warna Tema Kolom">
        <div className="grid grid-cols-2 gap-4">
          {([
            ['warna_tahfidz',     '🕌 Kolom Tahfidz'],
            ['warna_non_tahfidz', '🏆 Kolom Non Tahfidz'],
            ['warna_kegiatan',    '⭐ Kolom Kegiatan'],
            ['warna_progres',     '🌱 Kolom Progres'],
          ] as const).map(([key, label]) => (
            <div key={key}>
              <label className="label">{label}</label>
              <div className="flex items-center gap-3">
                <input type="color" value={cfg[key]}
                  onChange={e => set(key, e.target.value)}
                  className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer p-1"/>
                <input className="input flex-1 font-mono text-sm" value={cfg[key]}
                  onChange={e => set(key, e.target.value)}
                  placeholder="#000000"/>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-gray-50 rounded-lg p-3 mt-2">
          <p className="text-xs text-gray-500">💡 Warna yang dipilih dipakai untuk header kolom. Badan kolom otomatis pakai versi terang dari warna tersebut.</p>
        </div>
      </Section>

      {/* UKURAN */}
      <Section title="📐 Ukuran">
        {([
          ['ukuran_judul', 'Judul "ACHIEVEMENT"', 20, 40, 'pt'],
          ['ukuran_nama',  'Nama santri',          14, 32, 'pt'],
          ['ukuran_isi',   'Isi kolom & teks',      7, 14, 'pt'],
          ['ukuran_logo',  'Logo institusi',        50,120, 'px'],
        ] as [keyof Config, string, number, number, string][]).map(([key, label, min, max, unit]) => (
          <Field key={key} label={`${label} — ${cfg[key]}${unit}`}>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-400 w-8 text-right">{min}</span>
              <input type="range" min={min} max={max} step={1}
                value={cfg[key] as number}
                onChange={e => set(key, parseInt(e.target.value))}
                className="flex-1 accent-emerald-600"/>
              <span className="text-xs text-gray-400 w-8">{max}</span>
              <input type="number" min={min} max={max}
                value={cfg[key] as number}
                onChange={e => set(key, parseInt(e.target.value) || min)}
                className="input w-16 text-center text-sm py-1"/>
            </div>
          </Field>
        ))}
      </Section>

      {/* TAMPILAN */}
      <Section title="👁 Tampilkan / Sembunyikan Bagian">
        {([
          ['tampil_progres',  '🌱 Bagian Progres Pribadi'],
          ['tampil_motivasi', '💌 Kotak Pesan untuk Orang Tua'],
          ['tampil_ayat',     '📖 Ayat / Kutipan di Footer'],
        ] as [keyof Config, string][]).map(([key, label]) => (
          <label key={key} className="flex items-center gap-3 cursor-pointer group">
            <div className={`w-11 h-6 rounded-full transition-colors relative
              ${cfg[key] ? 'bg-emerald-500' : 'bg-gray-200'}`}
              onClick={() => set(key, !cfg[key])}>
              <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all
                ${cfg[key] ? 'left-5' : 'left-0.5'}`}/>
            </div>
            <span className={`text-sm ${cfg[key] ? 'text-gray-800 font-medium' : 'text-gray-400'}`}>
              {label}
            </span>
          </label>
        ))}
      </Section>

      {/* Tombol simpan bawah */}
      <div className="flex gap-3 pb-8">
        <button onClick={save} disabled={saving} className="btn btn-primary flex-1">
          {saving ? 'Menyimpan...' : '💾 Simpan Semua Perubahan'}
        </button>
        <Link href="/admin/achievement" className="btn">
          👁 Lihat Preview
        </Link>
      </div>
    </div>
  )
}
