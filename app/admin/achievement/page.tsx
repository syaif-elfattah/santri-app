'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

type Kelas      = { id: string; nama: string }
type TahunAjaran= { id: string; nama: string; aktif: boolean }
type AchConfig  = {
  nama_institusi: string; judul: string; subjudul: string; label_diberikan: string
  teks_motivasi_1: string; teks_motivasi_2: string; teks_motivasi_3: string
  label_motivasi: string; teks_ayat: string; referensi_ayat: string
  warna_tahfidz: string; warna_non_tahfidz: string; warna_kegiatan: string; warna_progres: string
  warna_judul: string; warna_inst: string; warna_subjudul: string
  warna_label: string; warna_nama: string; warna_kelas: string
  warna_motivasi_title: string; warna_motivasi: string
  warna_ayat: string; warna_ayat_ref: string; warna_tanggal: string
  ukuran_logo: number; ukuran_judul: number; ukuran_inst: number
  ukuran_subjudul: number; ukuran_label: number; ukuran_nama: number
  ukuran_kelas: number; ukuran_hdr_kolom: number; ukuran_sub_kolom: number
  ukuran_isi: number; ukuran_total_label: number; ukuran_total_num: number
  ukuran_motivasi_title: number; ukuran_motivasi: number
  ukuran_ayat: number; ukuran_tanggal: number
  bold_judul: boolean; bold_inst: boolean; bold_subjudul: boolean
  bold_label: boolean; bold_nama: boolean; bold_kelas: boolean
  bold_isi: boolean; bold_motivasi: boolean; bold_ayat: boolean; bold_tanggal: boolean
  tampil_progres: boolean; tampil_motivasi: boolean; tampil_ayat: boolean
}
const DEFAULT_CFG: AchConfig = {
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
type JuzEntry   = { juz: number; level: number }
type NonTahfidz = { juara: string; cabang: string; penyelenggara: string; bulan_tahun: string }
type Prestasi   = {
  kegiatan_sekolah: string; kegiatan_pondok: string
  prestasi_tahfidz: JuzEntry[]; prestasi_non_tahfidz: NonTahfidz[]
  progres_pribadi: string
}
type SantriItem = {
  santri: { id: string; nama: string; no_urut: number; kelas: { nama: string } }
  prestasi: Prestasi | null
}

const JUZ_VAL: Record<number,number> = { 1:1, 2:0.75, 3:0.5, 4:0.25 }
const JUZ_LBL: Record<number,string> = { 1:'', 2:'(¾)', 3:'(½)', 4:'(¼)' }

// Motivasi sekarang dari database (achievement_config)

function totalJuz(list: JuzEntry[]): number {
  return list.reduce((s,j) => s + (JUZ_VAL[j.level] || 0), 0)
}
function fmtJuz(n: number): string {
  const w = Math.floor(n), f = n - w
  if (f === 0) return `${w}`
  if (Math.abs(f-0.75)<0.01) return w ? `${w}¾` : '¾'
  if (Math.abs(f-0.5) <0.01) return w ? `${w}½` : '½'
  if (Math.abs(f-0.25)<0.01) return w ? `${w}¼` : '¼'
  return n.toFixed(2)
}
function todayKudus(): string {
  const d = new Date()
  const M = ['Januari','Februari','Maret','April','Mei','Juni',
             'Juli','Agustus','September','Oktober','November','Desember']
  return `Kudus, ${d.getDate()} ${M[d.getMonth()]} ${d.getFullYear()}`
}

// ─── Text formatting helpers ─────────────────────────────────
function toTitleCase(str: string): string {
  if (!str) return ''
  return str.split(' ').map(word => {
    if (!word) return ''
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  }).join(' ')
}

function toSentenceCase(str: string): string {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// Sentence case per baris (untuk multiline)
function toSentenceCaseLines(str: string): string {
  if (!str) return ''
  return str.split('\n').map(line => {
    const trimmed = line.trim()
    if (!trimmed) return line
    // Jaga bullet point di awal
    if (trimmed.startsWith('•')) {
      const rest = trimmed.slice(1).trim()
      return '• ' + toSentenceCase(rest)
    }
    return toSentenceCase(trimmed)
  }).join('\n')
}

// Title case per baris
function toTitleCaseLines(str: string): string {
  if (!str) return ''
  return str.split('\n').map(line => {
    const trimmed = line.trim()
    if (!trimmed) return line
    if (trimmed.startsWith('•')) {
      const rest = trimmed.slice(1).trim()
      return '• ' + toTitleCase(rest)
    }
    return toTitleCase(trimmed)
  }).join('\n')
}

// Kapitalkan nama bulan di awal kata (Januari, Februari, dst)
const BULAN = ['januari','februari','maret','april','mei','juni',
               'juli','agustus','september','oktober','november','desember']
function kapitalisasiBulan(str: string): string {
  if (!str) return ''
  let result = str
  BULAN.forEach(b => {
    const regex = new RegExp(b, 'gi')
    result = result.replace(regex, b.charAt(0).toUpperCase() + b.slice(1))
  })
  return result
}

// ─── Build HTML satu halaman achievement ─────────────────────
function buildCardHTML(item: SantriItem, motivasi: string, tanggal: string, tahunAjaran: string, cfg: AchConfig, musyrifKelas: {nama: string}[]): string {
  const { santri, prestasi } = item

  // ── Format nama santri → Title Case ──
  const namaSantri = toTitleCase(santri.nama || '')

  const tahfidz    = prestasi?.prestasi_tahfidz    || []
  const nonTahfidz = (prestasi?.prestasi_non_tahfidz || []).map((n: any) => ({
    ...n,
    // Juara → Sentence case, Cabang lomba → Title Case
    // Penyelenggara → Sentence case, Bulan → kapitalkan nama bulan
    juara:         toSentenceCase(n.juara || ''),
    cabang:        toTitleCase(n.cabang || ''),
    penyelenggara: (n.penyelenggara || '').toUpperCase(),
    bulan_tahun:   kapitalisasiBulan(n.bulan_tahun || ''),
  }))

  // Kegiatan → Title Case per baris
  const kegiatan = [
    ...(prestasi?.kegiatan_sekolah ? toTitleCaseLines(prestasi.kegiatan_sekolah).split('\n').filter(Boolean) : []),
    ...(prestasi?.kegiatan_pondok  ? toTitleCaseLines(prestasi.kegiatan_pondok).split('\n').filter(Boolean)  : []),
  ]

  // Progres → Sentence case per baris
  const progres = prestasi?.progres_pribadi
    ? toSentenceCaseLines(prestasi.progres_pribadi).split('\n').filter(Boolean)
    : []

  const hasTahfidz  = tahfidz.length > 0
  const hasNon      = nonTahfidz.length > 0
  const hasKegiatan = kegiatan.length > 0
  const hasProgres  = progres.length > 0

  if (!hasTahfidz && !hasNon && !hasKegiatan && !hasProgres) return ''

  const tot    = totalJuz(tahfidz)
  const totStr = fmtJuz(tot)
  const sorted = [...tahfidz].sort((a,b)=>a.juz-b.juz)

  const juzRows = sorted.map(j =>
    `<div class="juz-row"><span style="color:#92400e;font-weight:700">✦</span> Juz ${j.juz} ${JUZ_LBL[j.level]}</div>`
  ).join('')

  const nonRows = nonTahfidz.map((n,i) => `
    <div class="non-row" ${i<nonTahfidz.length-1?'style="border-bottom:1px solid #a7f3d0;padding-bottom:2.5mm;margin-bottom:2.5mm"':''}>
      <div class="non-juara"><span style="color:#065f46;font-weight:700">✦</span> ${n.juara}</div>
      <div class="non-detail">${n.cabang}</div>
      <div class="non-small">${n.penyelenggara}</div>
      <div class="non-small">${n.bulan_tahun}</div>
    </div>`).join('')

  const kegRows = kegiatan.map(k =>
    `<div class="keg-row"><span style="color:#1e40af;font-weight:700">✦</span> ${k.replace(/^•\s*/,'')}</div>`
  ).join('')

  const progresRows = progres.map(p =>
    `<div class="prog-row"><span style="color:#7c3aed;font-weight:700">✦</span> ${p.replace(/^•\s*/,'')}</div>`
  ).join('')

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8"/>
<link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&display=swap" rel="stylesheet"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  @page{size:A4 portrait;margin:0}
  body{width:210mm;min-height:297mm;font-family:'Poppins',sans-serif;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .page{width:210mm;min-height:297mm;position:relative;display:flex;flex-direction:column;padding:14mm 13mm 14mm;background:#fff;overflow:hidden}
  .border-outer{position:absolute;inset:7mm;border:2.5px solid #B8860B;border-radius:4px;pointer-events:none}
  .border-inner{position:absolute;inset:11mm;border:1px solid #D4AF37;border-radius:2px;pointer-events:none}
  .c{position:absolute;width:24px;height:24px;border-color:#B8860B;border-style:solid}
  .c-tl{top:3mm;left:3mm;border-width:4px 0 0 4px}
  .c-tr{top:3mm;right:3mm;border-width:4px 4px 0 0}
  .c-bl{bottom:3mm;left:3mm;border-width:0 0 4px 4px}
  .c-br{bottom:3mm;right:3mm;border-width:0 4px 4px 0}
  .wm{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:65px;opacity:0.03;color:#1a5c3a;font-weight:700;white-space:nowrap;letter-spacing:8px;pointer-events:none}
  .content{position:relative;z-index:2;flex:1;display:flex;flex-direction:column;gap:2.5mm}
  .logo{width:${cfg.ukuran_logo}px;height:${cfg.ukuran_logo}px;object-fit:contain;display:block;margin:0 auto 2.5mm}
  .inst{font-size:${cfg.ukuran_inst}pt;font-weight:${cfg.bold_inst?700:500};letter-spacing:3px;color:${cfg.warna_inst};text-transform:uppercase;text-align:center;margin-bottom:1mm}
  .title{font-size:${cfg.ukuran_judul}pt;font-weight:${cfg.bold_judul?700:400};color:${cfg.warna_judul};letter-spacing:5px;text-align:center;margin-bottom:1mm}
  .divider{display:flex;align-items:center;justify-content:center;gap:6px;margin:0.5mm 0}
  .dl{height:1px;width:40px;background:linear-gradient(to right,transparent,#B8860B)}
  .dr{height:1px;width:40px;background:linear-gradient(to left,transparent,#B8860B)}
  .subtitle{font-size:${cfg.ukuran_subjudul}pt;font-weight:${cfg.bold_subjudul?600:400};color:${cfg.warna_subjudul};font-style:italic;text-align:center}
  .nama-box{background:linear-gradient(135deg,#f9f6ed,#fdf8ef);border:1.5px solid #D4AF37;border-radius:8px;padding:3mm 8mm;text-align:center;box-shadow:0 2px 8px rgba(184,134,11,.12)}
  .diberikan{font-size:${cfg.ukuran_label}pt;font-weight:${cfg.bold_label?700:600};color:${cfg.warna_label};letter-spacing:3px;text-transform:uppercase;margin-bottom:1.5mm}
  .nama{font-size:${cfg.ukuran_nama}pt;font-weight:${cfg.bold_nama?700:400};color:${cfg.warna_nama};margin-bottom:1mm;line-height:1.2}
  .kelas-txt{font-size:${cfg.ukuran_kelas}pt;font-weight:${cfg.bold_kelas?600:500};color:${cfg.warna_kelas}}
  .grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:2.5mm}
  .col{border-radius:7px;overflow:hidden;display:flex;flex-direction:column}
  .col-hdr{padding:2.5mm;text-align:center}
  .col-hdr-t{font-size:${cfg.ukuran_hdr_kolom}pt;font-weight:700;color:#fff;letter-spacing:1px;text-transform:uppercase}
  .col-hdr-s{font-size:${cfg.ukuran_sub_kolom}pt;font-weight:500;letter-spacing:0.5px;text-transform:uppercase;margin-top:1px}
  .col-tahfidz{border:1.5px solid ${cfg.warna_tahfidz}}
  .col-tahfidz .col-hdr{background:linear-gradient(135deg,#78350f,${cfg.warna_tahfidz})}
  .col-tahfidz .col-hdr-s{color:#fef3c7}
  .col-tahfidz .col-body{background:#fffbeb;flex:1;padding:2.5mm;font-size:${cfg.ukuran_isi}pt;color:#451a03;font-weight:${cfg.bold_isi?600:400}}
  .total-box{background:linear-gradient(135deg,#92400e,#D4AF37);border-radius:5px;padding:2mm;text-align:center;margin-bottom:2mm}
  .total-label{font-size:${cfg.ukuran_total_label}pt;font-weight:600;color:#fef9c3;letter-spacing:1px;text-transform:uppercase}
  .total-num{font-size:${cfg.ukuran_total_num}pt;font-weight:700;color:#fff;line-height:1.1}
  .total-unit{font-size:${cfg.ukuran_total_label}pt;font-weight:600;color:#fef3c7}
  .juz-row{display:flex;align-items:center;gap:2mm;margin-bottom:1.5mm;font-size:${cfg.ukuran_isi}pt;color:#451a03;font-weight:${cfg.bold_isi?600:500}}
  .col-non{border:1.5px solid ${cfg.warna_non_tahfidz}}
  .col-non .col-hdr{background:linear-gradient(135deg,#064e3b,${cfg.warna_non_tahfidz})}
  .col-non .col-hdr-s{color:#a7f3d0}
  .col-non .col-body{background:#ecfdf5;flex:1;padding:2.5mm;font-size:${cfg.ukuran_isi}pt;color:#064e3b;font-weight:${cfg.bold_isi?600:400}}
  .non-juara{font-weight:${cfg.bold_isi?700:600};display:flex;gap:2mm;align-items:flex-start;margin-bottom:1px;font-size:${cfg.ukuran_isi}pt;color:#064e3b}
  .non-detail{color:#065f46;margin-left:5mm;font-size:${cfg.ukuran_isi}pt;font-weight:${cfg.bold_isi?600:500}}
  .non-small{color:#374151;font-size:${cfg.ukuran_isi}pt;margin-left:5mm;font-weight:400}
  .col-keg{border:1.5px solid ${cfg.warna_kegiatan}}
  .col-keg .col-hdr{background:linear-gradient(135deg,#1e3a8a,${cfg.warna_kegiatan})}
  .col-keg .col-hdr-s{color:#bfdbfe}
  .col-keg .col-body{background:#eff6ff;flex:1;padding:2.5mm;font-size:${cfg.ukuran_isi}pt;color:#1e3a8a;font-weight:${cfg.bold_isi?600:500}}
  .keg-row{display:flex;gap:2mm;margin-bottom:1.5mm;align-items:flex-start;font-weight:${cfg.bold_isi?600:500};color:#1e3a8a}
  .empty{color:#9ca3af;font-style:italic;font-size:${cfg.ukuran_isi}pt;font-weight:400}
  .progres-box{background:linear-gradient(135deg,#f5f3ff,#ede9fe);border:1.5px solid ${cfg.warna_progres};border-radius:7px;overflow:hidden}
  .progres-hdr{background:linear-gradient(135deg,#4c1d95,${cfg.warna_progres});padding:2.5mm 3mm;display:flex;align-items:center;gap:2mm}
  .progres-hdr-t{font-size:${cfg.ukuran_hdr_kolom}pt;font-weight:700;color:#fff;letter-spacing:1px;text-transform:uppercase}
  .progres-body{padding:2.5mm 3mm;display:flex;flex-wrap:wrap;gap:1.5mm}
  .prog-row{display:flex;gap:2mm;align-items:flex-start;font-size:${cfg.ukuran_isi}pt;color:#4c1d95;font-weight:${cfg.bold_isi?600:500};width:calc(50% - 0.75mm)}
  .motivasi{background:linear-gradient(135deg,#f9f6ed,#fdf8ef);border:1px solid #d97706;border-radius:7px;padding:2mm 5mm;text-align:center}
  .motivasi-title{font-size:${cfg.ukuran_motivasi_title}pt;font-weight:700;color:${cfg.warna_motivasi_title};letter-spacing:2px;text-transform:uppercase;margin-bottom:1mm}
  .motivasi-text{font-size:${cfg.ukuran_motivasi}pt;font-weight:${cfg.bold_motivasi?500:400};color:${cfg.warna_motivasi};font-style:italic;line-height:1.7}
  .footer{border-top:1px solid #d1d5db;padding-top:2mm;margin-bottom:1mm;display:flex;justify-content:space-between;align-items:center}
  .ayat{font-size:${cfg.ukuran_ayat}pt;font-weight:${cfg.bold_ayat?600:400};color:${cfg.warna_ayat};font-style:italic;line-height:1.7;max-width:65%}
  .ayat-ref{color:${cfg.warna_ayat_ref};display:block;margin-top:1mm;font-weight:${cfg.bold_ayat?700:600}}
  .tgl{font-size:${cfg.ukuran_tanggal}pt;font-weight:${cfg.bold_tanggal?700:600};color:${cfg.warna_tanggal};text-align:right}
</style>
</head>
<body>
<div class="page">
  <div class="border-outer"></div>
  <div class="border-inner"></div>
  <div class="c c-tl"></div><div class="c c-tr"></div>
  <div class="c c-bl"></div><div class="c c-br"></div>
  <div class="wm">MA'AHID KUDUS</div>
  <div class="content">
    <!-- Header -->
    <div style="text-align:center">
      <img class="logo" src="/logo-maahid-sm.png" alt="Logo"/>
      <div class="inst">${cfg.nama_institusi}</div>
      <div class="title">${cfg.judul}</div>
      <div class="divider"><div class="dl"></div><span style="color:#B8860B;font-size:10pt">✦</span><div class="dr"></div></div>
      <div class="subtitle">${cfg.subjudul} &bull; Tahun Ajaran ${tahunAjaran}</div>
    </div>
    <!-- Nama -->
    <div class="nama-box">
      <div class="diberikan">${cfg.label_diberikan}</div>
      <div class="nama">${namaSantri}</div>
      <div class="kelas-txt">${santri.kelas?.nama || ''}</div>
    </div>
    <!-- Grid prestasi -->
    <div class="grid">
      <div class="col col-tahfidz">
        <div class="col-hdr"><div class="col-hdr-t">🕌 Prestasi</div><div class="col-hdr-s">Tahfidz Al-Qur'an</div></div>
        <div class="col-body">
          ${hasTahfidz ? `
            <div class="total-box">
              <div class="total-label">Telah Menghafal</div>
              <div class="total-num">${totStr}</div>
              <div class="total-unit">Juz Al-Qur'an</div>
            </div>${juzRows}
          ` : '<span class="empty">—</span>'}
        </div>
      </div>
      <div class="col col-non">
        <div class="col-hdr"><div class="col-hdr-t">🏆 Prestasi</div><div class="col-hdr-s">Non Tahfidz</div></div>
        <div class="col-body">${hasNon ? nonRows : '<span class="empty">—</span>'}</div>
      </div>
      <div class="col col-keg">
        <div class="col-hdr"><div class="col-hdr-t">⭐ Participated</div><div class="col-hdr-s">Activities</div></div>
        <div class="col-body">${hasKegiatan ? kegRows : '<span class="empty">—</span>'}</div>
      </div>
    </div>
    <!-- Progres Pribadi -->
    <div class="progres-box">
      <div class="progres-hdr"><div class="progres-hdr-t">🌱 Progres Pribadi Selama 1 Tahun</div></div>
      <div class="progres-body">
        ${hasProgres ? progresRows : '<span class="empty">Belum ada catatan progres</span>'}
      </div>
    </div>
    <!-- Motivasi -->
    <div class="motivasi">
      <div class="motivasi-title">${cfg.label_motivasi}</div>
      <div class="motivasi-text">"${motivasi}"</div>
    </div>
    <!-- Footer -->
    <div class="footer">
      <div class="ayat">
        "${cfg.teks_ayat}"
        <span class="ayat-ref">${cfg.referensi_ayat}</span>
      </div>
      <div style="text-align:right">
        <div class="tgl" style="margin-bottom:8mm">${tanggal}</div>
        ${musyrifKelas.length > 0 ? `
        <div style="display:flex;gap:10mm;justify-content:flex-end">
          ${musyrifKelas.map(m => `
            <div style="text-align:center;min-width:28mm">
              <div style="font-size:6pt;color:#6b7280;margin-bottom:7mm">Musyrif/Musyrifah,</div>
              <div style="border-top:1px solid #374151;padding-top:1mm;font-size:6.5pt;font-weight:600;color:#374151">${m.nama}</div>
            </div>
          `).join('')}
        </div>
        ` : ''}
      </div>
    </div>
  </div>
</div>
</body>
</html>`
}

// ─── Preview via iframe ───────────────────────────────────────
function PreviewCard({ item, motivasi, tanggal, tahunAjaran, cfg, musyrifKelas }: {
  item: SantriItem; motivasi: string; tanggal: string; tahunAjaran: string; cfg: AchConfig; musyrifKelas: {nama: string}[]
}) {
  const html = buildCardHTML(item, motivasi, tanggal, tahunAjaran, cfg, musyrifKelas)
  if (!html) return (
    <div style={{width:'210mm',minHeight:'60mm',display:'flex',alignItems:'center',justifyContent:'center',
      border:'1px dashed #d1d5db',borderRadius:8,color:'#9ca3af',fontSize:13,fontStyle:'italic'}}>
      {item.santri.nama} — tidak ada data prestasi
    </div>
  )
  return (
    <iframe srcDoc={html} style={{width:'210mm',minHeight:'297mm',border:'none',display:'block'}}
      scrolling="no" title={`ach-${item.santri.nama}`}/>
  )
}

// ─── Print semua ke 1 window bersih ──────────────────────────
function doCetak(data: SantriItem[], tanggal: string, kelasNama: string, tahunAjaran: string, cfg: AchConfig, musyrifKelas: {nama: string}[]) {
  const pages = data
    .map((item, i) => buildCardHTML(item, [cfg.teks_motivasi_1, cfg.teks_motivasi_2, cfg.teks_motivasi_3][i % 3], tanggal, tahunAjaran, cfg, musyrifKelas))
    .filter(Boolean)

  if (!pages.length) { alert('Tidak ada data untuk dicetak'); return }

  const styleMatch = pages[0].match(/<style>([\s\S]*?)<\/style>/)
  const css = styleMatch ? styleMatch[1] : ''

  const bodies = pages.map(p => {
    const m = p.match(/<body>([\s\S]*?)<\/body>/)
    return m ? m[1] : p
  })

  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) { alert('Pop-up diblokir. Izinkan pop-up browser untuk mencetak.'); return }

  win.document.write(`<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8"/>
<link href="https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400&display=swap" rel="stylesheet"/>
<title>Achievement ${kelasNama} — ${tahunAjaran}</title>
<style>
  ${css}
  *{box-sizing:border-box;margin:0;padding:0}
  @page{size:A4 portrait;margin:0}
  body{background:#fff;font-family:'Poppins',sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .pw{page-break-after:always}
  .pw:last-child{page-break-after:avoid}
</style>
</head>
<body>
${bodies.map(b => `<div class="pw">${b}</div>`).join('\n')}
<script>
  window.onload = function() { setTimeout(function(){ window.print(); }, 1000) }
<\/script>
</body>
</html>`)
  win.document.close()
}

// ─── Halaman utama ────────────────────────────────────────────
export default function AchievementPage() {
  const params      = useSearchParams()
  const initKelasId = params.get('kelas_id') || ''

  const [kelasList,     setKelasList]     = useState<Kelas[]>([])
  const [taList,        setTaList]        = useState<TahunAjaran[]>([])
  const [activeKelasId, setActiveKelasId] = useState(initKelasId)
  const [activeTaId,    setActiveTaId]    = useState('')
  const [data,          setData]          = useState<SantriItem[]>([])
  const [loading,       setLoading]       = useState(false)
  const [cfg,           setCfg]           = useState<AchConfig>(DEFAULT_CFG)
  const [musyrifKelas,  setMusyrifKelas]  = useState<{nama: string}[]>([])
  const tanggal = todayKudus()

  // Load kelas + TA + config
  useEffect(() => {
    fetch('/api/achievement-config').then(r=>r.json()).then(d => setCfg({...DEFAULT_CFG,...d}))
    fetch('/api/kelas').then(r=>r.json()).then((k: Kelas[]) => {
      setKelasList(k)
      if (!activeKelasId && k.length) setActiveKelasId(k[0].id)
    })
    fetch('/api/tahun-ajaran').then(r=>r.json()).then((t: TahunAjaran[]) => {
      setTaList(t)
      const aktif = t.find(x => x.aktif)
      if (aktif) setActiveTaId(aktif.id)
    })
  }, [])

  // Load data santri + prestasi + musyrif kelas
  useEffect(() => {
    if (!activeKelasId) return
    setLoading(true)
    const taParam = activeTaId ? `&tahun_ajaran_id=${activeTaId}` : ''
    Promise.all([
      fetch(`/api/prestasi/achievement?kelas_id=${activeKelasId}${taParam}`).then(r => r.json()),
      fetch(`/api/kelas-musyrif?kelas_id=${activeKelasId}`).then(r => r.json()),
    ]).then(([d, km]) => {
      setData(d)
      const mk = (km || []).map((x: any) => ({ nama: x.musyrif?.nama || '' })).filter((x: any) => x.nama)
      setMusyrifKelas(mk)
      setLoading(false)
    })
  }, [activeKelasId, activeTaId])

  const kelasNama   = kelasList.find(k => k.id === activeKelasId)?.nama || ''
  const tahunAjaran = taList.find(t => t.id === activeTaId)?.nama || '2025/2026'
  const adaData     = data.filter(item => {
    const p = item.prestasi
    if (!p) return false
    return (p.prestasi_tahfidz?.length||0)>0 ||
           (p.prestasi_non_tahfidz?.length||0)>0 ||
           p.kegiatan_sekolah || p.kegiatan_pondok || p.progres_pribadi
  })

  const handleCetak = useCallback(() => {
    doCetak(data, tanggal, kelasNama, tahunAjaran, cfg, musyrifKelas)
  }, [data, tanggal, kelasNama, tahunAjaran, cfg, musyrifKelas])

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/admin/prestasi" className="btn text-sm">← Kembali</Link>
          <div>
            <h1 className="text-lg font-semibold">Cetak Achievement</h1>
            <p className="text-xs text-gray-400">{kelasNama} · TA {tahunAjaran} · {adaData.length} santri ada data · {tanggal}</p>
          </div>
        </div>
        <button onClick={handleCetak} disabled={loading || adaData.length === 0}
          className="btn btn-primary text-sm disabled:opacity-50">
          🖨 Cetak Semua → PDF
        </button>
      </div>

      <div className="px-6 py-4 bg-white border-b border-gray-100 space-y-3">
        {/* Pilih kelas */}
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs font-medium text-gray-500 w-20">Kelas:</span>
          {kelasList.map(k => (
            <button key={k.id} onClick={() => setActiveKelasId(k.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors
                ${activeKelasId===k.id ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-white border-gray-200 text-gray-600 hover:border-emerald-300'}`}>
              {k.nama}
            </button>
          ))}
        </div>
        {/* Pilih tahun ajaran */}
        <div className="flex gap-2 flex-wrap items-center">
          <span className="text-xs font-medium text-gray-500 w-20">Tahun Ajaran:</span>
          {taList.map(ta => (
            <button key={ta.id} onClick={() => setActiveTaId(ta.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors
                ${activeTaId===ta.id ? 'bg-purple-600 text-white border-purple-700' : 'bg-white border-gray-200 text-gray-600 hover:border-purple-300'}`}>
              {ta.nama} {ta.aktif && <span className="text-xs opacity-75">(aktif)</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Info */}
      {!loading && data.length > 0 && (
        <div className="px-6 pt-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
            <strong>{adaData.length}</strong> dari {data.length} santri memiliki data di TA {tahunAjaran}.
            Klik <strong>"Cetak Semua → PDF"</strong> → pilih <strong>Save as PDF</strong> di dialog print.
            {data.length - adaData.length > 0 && (
              <span className="text-amber-700"> · {data.length - adaData.length} santri tanpa data dilewati.</span>
            )}
          </div>
        </div>
      )}

      {loading && <div className="py-24 text-center text-gray-400 text-sm">Memuat data...</div>}

      {/* Preview */}
      <div className="px-6 py-6 space-y-8">
        {data.map((item, i) => {
          const p = item.prestasi
          const punya = p && (
            (p.prestasi_tahfidz?.length||0)>0 ||
            (p.prestasi_non_tahfidz?.length||0)>0 ||
            p.kegiatan_sekolah || p.kegiatan_pondok || p.progres_pribadi
          )
          return (
            <div key={item.santri.id}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-medium text-gray-700">{item.santri.nama}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                  ${punya ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                  {punya ? '✓ Akan dicetak' : 'Tidak ada data — dilewati'}
                </span>
              </div>
              <div className="shadow-xl rounded-sm overflow-hidden" style={{width:'210mm'}}>
                <PreviewCard item={item} motivasi={[cfg.teks_motivasi_1, cfg.teks_motivasi_2, cfg.teks_motivasi_3][i % 3]}
                  tanggal={tanggal} tahunAjaran={tahunAjaran} cfg={cfg} musyrifKelas={musyrifKelas}/>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
