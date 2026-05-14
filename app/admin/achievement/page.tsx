'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

type Kelas      = { id: string; nama: string }
type TahunAjaran= { id: string; nama: string; aktif: boolean }
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

const MOTIVASI = [
  'Ayah & Bunda, setiap doa yang kalian panjatkan adalah investasi terbaik yang tidak ternilai. Teruslah hadir dan mendukung — kehadiran kalian adalah energi terbesar bagi perjalanan ananda.',
  'Terima kasih, Ayah & Bunda, telah mempercayakan ananda kepada kami. Setiap langkah kecil yang ananda tempuh adalah buah dari kasih sayang dan doa kalian yang tiada putus.',
  'Ayah & Bunda yang luar biasa, prestasi bukan hanya angka dan piala — tetapi karakter yang tumbuh, akhlak yang terbentuk, dan hati yang semakin dekat kepada Allah. Ananda sedang dalam perjalanan indah itu.',
]

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

// ─── Build HTML satu halaman achievement ─────────────────────
function buildCardHTML(item: SantriItem, motivasi: string, tanggal: string, tahunAjaran: string): string {
  const { santri, prestasi } = item
  const tahfidz    = prestasi?.prestasi_tahfidz    || []
  const nonTahfidz = prestasi?.prestasi_non_tahfidz || []
  const kegiatan   = [
    ...(prestasi?.kegiatan_sekolah?.split('\n').filter(Boolean) || []),
    ...(prestasi?.kegiatan_pondok?.split('\n').filter(Boolean)  || []),
  ]
  const progres = prestasi?.progres_pribadi?.split('\n').filter(Boolean) || []

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
  /* Header */
  .logo{width:80px;height:80px;object-fit:contain;display:block;margin:0 auto 2.5mm}
  .inst{font-size:9pt;font-weight:600;letter-spacing:3px;color:#374151;text-transform:uppercase;text-align:center;margin-bottom:1mm}
  .title{font-size:28pt;font-weight:700;color:#1a3a2a;letter-spacing:5px;text-align:center;margin-bottom:1mm}
  .divider{display:flex;align-items:center;justify-content:center;gap:6px;margin:0.5mm 0}
  .dl{height:1px;width:40px;background:linear-gradient(to right,transparent,#B8860B)}
  .dr{height:1px;width:40px;background:linear-gradient(to left,transparent,#B8860B)}
  .subtitle{font-size:8.5pt;font-weight:400;color:#6b7280;font-style:italic;text-align:center}
  /* Nama */
  .nama-box{background:linear-gradient(135deg,#f9f6ed,#fdf8ef);border:1.5px solid #D4AF37;border-radius:8px;padding:3mm 8mm;text-align:center;box-shadow:0 2px 8px rgba(184,134,11,.12)}
  .diberikan{font-size:7.5pt;font-weight:600;color:#9ca3af;letter-spacing:3px;text-transform:uppercase;margin-bottom:1.5mm}
  .nama{font-size:21pt;font-weight:700;color:#1a5c3a;margin-bottom:1mm;line-height:1.2}
  .kelas-txt{font-size:10pt;font-weight:500;color:#4b5563}
  /* Grid 3 kolom */
  .grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:2.5mm}
  .col{border-radius:7px;overflow:hidden;display:flex;flex-direction:column}
  .col-hdr{padding:2.5mm;text-align:center}
  .col-hdr-t{font-size:8.5pt;font-weight:700;color:#fff;letter-spacing:1px;text-transform:uppercase}
  .col-hdr-s{font-size:7.5pt;font-weight:500;letter-spacing:0.5px;text-transform:uppercase;margin-top:1px}
  /* Tahfidz */
  .col-tahfidz{border:1.5px solid #b45309}
  .col-tahfidz .col-hdr{background:linear-gradient(135deg,#78350f,#b45309)}
  .col-tahfidz .col-hdr-s{color:#fef3c7}
  .col-tahfidz .col-body{background:#fffbeb;flex:1;padding:2.5mm;font-size:8.5pt;color:#451a03}
  .total-box{background:linear-gradient(135deg,#92400e,#D4AF37);border-radius:5px;padding:2mm;text-align:center;margin-bottom:2mm}
  .total-label{font-size:7pt;font-weight:600;color:#fef9c3;letter-spacing:1px;text-transform:uppercase}
  .total-num{font-size:19pt;font-weight:700;color:#fff;line-height:1.1}
  .total-unit{font-size:8pt;font-weight:600;color:#fef3c7}
  .juz-row{display:flex;align-items:center;gap:2mm;margin-bottom:1.5mm;font-size:8.5pt;color:#451a03;font-weight:500}
  /* Non tahfidz */
  .col-non{border:1.5px solid #065f46}
  .col-non .col-hdr{background:linear-gradient(135deg,#064e3b,#065f46)}
  .col-non .col-hdr-s{color:#a7f3d0}
  .col-non .col-body{background:#ecfdf5;flex:1;padding:2.5mm;font-size:8.5pt;color:#064e3b}
  .non-juara{font-weight:700;display:flex;gap:2mm;align-items:flex-start;margin-bottom:1px;font-size:8.5pt;color:#064e3b}
  .non-detail{color:#065f46;margin-left:5mm;font-size:8pt;font-weight:500}
  .non-small{color:#374151;font-size:7.5pt;margin-left:5mm;font-weight:400}
  /* Kegiatan */
  .col-keg{border:1.5px solid #1e40af}
  .col-keg .col-hdr{background:linear-gradient(135deg,#1e3a8a,#1e40af)}
  .col-keg .col-hdr-s{color:#bfdbfe}
  .col-keg .col-body{background:#eff6ff;flex:1;padding:2.5mm;font-size:8.5pt;color:#1e3a8a}
  .keg-row{display:flex;gap:2mm;margin-bottom:1.5mm;align-items:flex-start;font-weight:500;color:#1e3a8a}
  .empty{color:#9ca3af;font-style:italic;font-size:8pt;font-weight:400}
  /* Progres Pribadi */
  .progres-box{background:linear-gradient(135deg,#f5f3ff,#ede9fe);border:1.5px solid #7c3aed;border-radius:7px;overflow:hidden}
  .progres-hdr{background:linear-gradient(135deg,#4c1d95,#7c3aed);padding:2.5mm 3mm;display:flex;align-items:center;gap:2mm}
  .progres-hdr-t{font-size:8.5pt;font-weight:700;color:#fff;letter-spacing:1px;text-transform:uppercase}
  .progres-body{padding:2.5mm 3mm;display:flex;flex-wrap:wrap;gap:1.5mm}
  .prog-row{display:flex;gap:2mm;align-items:flex-start;font-size:8.5pt;color:#4c1d95;font-weight:500;width:calc(50% - 0.75mm)}
  /* Motivasi */
  .motivasi{background:linear-gradient(135deg,#f9f6ed,#fdf8ef);border:1px solid #d97706;border-radius:7px;padding:2mm 5mm;text-align:center}
  .motivasi-title{font-size:7.5pt;font-weight:700;color:#92400e;letter-spacing:2px;text-transform:uppercase;margin-bottom:1mm}
  .motivasi-text{font-size:8.5pt;font-weight:400;color:#374151;font-style:italic;line-height:1.7}
  /* Footer */
  .footer{border-top:1px solid #d1d5db;padding-top:2mm;margin-bottom:1mm;display:flex;justify-content:space-between;align-items:center}
  .ayat{font-size:7.5pt;font-weight:400;color:#6b7280;font-style:italic;line-height:1.7;max-width:65%}
  .ayat-ref{color:#b45309;display:block;margin-top:1mm;font-weight:600}
  .tgl{font-size:8pt;font-weight:600;color:#374151;text-align:right}
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
      <div class="inst">Pondok Pesantren Ma'ahid Kudus</div>
      <div class="title">ACHIEVEMENT</div>
      <div class="divider"><div class="dl"></div><span style="color:#B8860B;font-size:10pt">✦</span><div class="dr"></div></div>
      <div class="subtitle">Catatan Prestasi &amp; Keaktifan Santri &bull; Tahun Ajaran ${tahunAjaran}</div>
    </div>
    <!-- Nama -->
    <div class="nama-box">
      <div class="diberikan">Diberikan Kepada</div>
      <div class="nama">${santri.nama}</div>
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
      <div class="motivasi-title">✦ Pesan untuk Ayah &amp; Bunda ✦</div>
      <div class="motivasi-text">"${motivasi}"</div>
    </div>
    <!-- Footer -->
    <div class="footer">
      <div class="ayat">
        "Dan barangsiapa yang bersungguh-sungguh di jalan Kami, maka Kami akan tunjukkan kepada mereka jalan-jalan Kami."
        <span class="ayat-ref">(QS. Al-'Ankabut: 69)</span>
      </div>
      <div class="tgl">${tanggal}</div>
    </div>
  </div>
</div>
</body>
</html>`
}

// ─── Preview via iframe ───────────────────────────────────────
function PreviewCard({ item, motivasi, tanggal, tahunAjaran }: {
  item: SantriItem; motivasi: string; tanggal: string; tahunAjaran: string
}) {
  const html = buildCardHTML(item, motivasi, tanggal, tahunAjaran)
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
function doCetak(data: SantriItem[], tanggal: string, kelasNama: string, tahunAjaran: string) {
  const pages = data
    .map((item, i) => buildCardHTML(item, MOTIVASI[i % MOTIVASI.length], tanggal, tahunAjaran))
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
  const tanggal = todayKudus()

  // Load kelas + TA
  useEffect(() => {
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

  // Load data santri + prestasi
  useEffect(() => {
    if (!activeKelasId) return
    setLoading(true)
    const taParam = activeTaId ? `&tahun_ajaran_id=${activeTaId}` : ''
    fetch(`/api/prestasi/achievement?kelas_id=${activeKelasId}${taParam}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
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
    doCetak(data, tanggal, kelasNama, tahunAjaran)
  }, [data, tanggal, kelasNama, tahunAjaran])

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
                <PreviewCard item={item} motivasi={MOTIVASI[i % MOTIVASI.length]}
                  tanggal={tanggal} tahunAjaran={tahunAjaran}/>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
