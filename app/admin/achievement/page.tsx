'use client'
import { useEffect, useState, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

type Kelas      = { id: string; nama: string }
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

const JUZ_VAL: Record<number, number>  = { 1:1, 2:0.75, 3:0.5, 4:0.25 }
const JUZ_LBL: Record<number, string>  = { 1:'', 2:'(¾)', 3:'(½)', 4:'(¼)' }

const MOTIVASI = [
  'Ayah & Bunda, setiap doa yang kalian panjatkan adalah investasi terbaik yang tidak ternilai. Teruslah hadir dan mendukung — kehadiran kalian adalah energi terbesar bagi perjalanan ananda.',
  'Terima kasih, Ayah & Bunda, telah mempercayakan ananda kepada kami. Setiap langkah kecil yang ananda tempuh adalah buah dari kasih sayang dan doa kalian yang tiada putus.',
  'Ayah & Bunda yang luar biasa, prestasi bukan hanya angka dan piala — tetapi karakter yang tumbuh, akhlak yang terbentuk, dan hati yang semakin dekat kepada Allah. Ananda sedang dalam perjalanan indah itu.',
]

function totalJuz(list: JuzEntry[]): number {
  return list.reduce((s, j) => s + (JUZ_VAL[j.level] || 0), 0)
}

function fmtJuz(n: number): string {
  const w = Math.floor(n), f = n - w
  if (f === 0)    return `${w}`
  if (Math.abs(f - 0.75) < 0.01) return w ? `${w}¾` : '¾'
  if (Math.abs(f - 0.5)  < 0.01) return w ? `${w}½` : '½'
  if (Math.abs(f - 0.25) < 0.01) return w ? `${w}¼` : '¼'
  return n.toFixed(2)
}

function todayKudus(): string {
  const d = new Date()
  const BULAN = ['Januari','Februari','Maret','April','Mei','Juni',
                 'Juli','Agustus','September','Oktober','November','Desember']
  return `Kudus, ${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`
}

// ─── HTML satu halaman achievement (string, untuk iframe/print) ──
function buildCardHTML(item: SantriItem, motivasi: string, tanggal: string): string {
  const { santri, prestasi } = item
  const tahfidz   = prestasi?.prestasi_tahfidz    || []
  const nonTahfidz= prestasi?.prestasi_non_tahfidz || []
  const kegiatan  = [
    ...(prestasi?.kegiatan_sekolah?.split('\n').filter(Boolean) || []),
    ...(prestasi?.kegiatan_pondok?.split('\n').filter(Boolean)  || []),
  ]
  const tot   = totalJuz(tahfidz)
  const totStr= fmtJuz(tot)
  const sorted= [...tahfidz].sort((a,b)=>a.juz-b.juz)

  const hasTahfidz   = tahfidz.length > 0
  const hasNon       = nonTahfidz.length > 0
  const hasKegiatan  = kegiatan.length > 0

  // skip jika benar-benar kosong semua
  if (!hasTahfidz && !hasNon && !hasKegiatan) return ''

  const juzRows = sorted.map(j =>
    `<div class="juz-row"><span class="bullet" style="color:#B8860B">✦</span> Juz ${j.juz} ${JUZ_LBL[j.level]}</div>`
  ).join('')

  const nonRows = nonTahfidz.map((n,i) => `
    <div class="non-row" style="${i < nonTahfidz.length-1 ? 'border-bottom:1px solid #dcfce7;padding-bottom:3mm;margin-bottom:3mm' : ''}">
      <div class="non-juara">✦ ${n.juara}</div>
      <div class="non-detail">${n.cabang}</div>
      <div class="non-small">${n.penyelenggara}</div>
      <div class="non-small">${n.bulan_tahun}</div>
    </div>`).join('')

  const kegRows = kegiatan.map(k =>
    `<div class="keg-row"><span class="bullet" style="color:#1d4ed8">✦</span> ${k.replace(/^•\s*/,'')}</div>`
  ).join('')

  return `
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  @page{size:A4 portrait;margin:0}
  body{width:210mm;min-height:297mm;font-family:Georgia,'Times New Roman',serif;background:#fff}
  .page{
    width:210mm;min-height:297mm;position:relative;
    display:flex;flex-direction:column;padding:18mm 16mm 14mm;
    background:#fff;overflow:hidden;
  }
  /* border emas */
  .border-outer{position:absolute;inset:8mm;border:2.5px solid #B8860B;border-radius:4px;pointer-events:none}
  .border-inner{position:absolute;inset:13mm;border:1px solid #D4AF37;border-radius:2px;pointer-events:none}
  /* corner */
  .c{position:absolute;width:22px;height:22px;border-color:#B8860B;border-style:solid}
  .c-tl{top:4mm;left:4mm;border-width:4px 0 0 4px}
  .c-tr{top:4mm;right:4mm;border-width:4px 4px 0 0}
  .c-bl{bottom:4mm;left:4mm;border-width:0 0 4px 4px}
  .c-br{bottom:4mm;right:4mm;border-width:0 4px 4px 0}
  /* watermark */
  .wm{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);
      font-size:70px;opacity:0.03;color:#1a5c3a;font-weight:bold;white-space:nowrap;letter-spacing:8px;pointer-events:none}
  /* content */
  .content{position:relative;z-index:2;flex:1;display:flex;flex-direction:column;gap:4mm}
  /* header */
  .logo{width:65px;height:65px;object-fit:contain;display:block;margin:0 auto 3mm}
  .inst{font-size:7.5pt;letter-spacing:3px;color:#666;text-transform:uppercase;text-align:center;margin-bottom:1mm}
  .title{font-size:24pt;font-weight:bold;color:#1a3a2a;letter-spacing:4px;text-align:center;margin-bottom:1mm}
  .divider{display:flex;align-items:center;justify-content:center;gap:6px;margin:1mm 0}
  .divider-line{height:1px;width:35px;background:linear-gradient(to right,transparent,#B8860B)}
  .divider-line.r{background:linear-gradient(to left,transparent,#B8860B)}
  .subtitle{font-size:7.5pt;color:#888;font-style:italic;text-align:center}
  /* nama box */
  .nama-box{
    background:linear-gradient(135deg,#f9f6ed,#fdf8ef);
    border:1.5px solid #D4AF37;border-radius:8px;padding:4mm 8mm;text-align:center;
    box-shadow:0 2px 8px rgba(184,134,11,.1)
  }
  .diberikan{font-size:7pt;color:#999;letter-spacing:3px;text-transform:uppercase;margin-bottom:2mm}
  .nama{font-size:19pt;font-weight:bold;color:#1a5c3a;margin-bottom:1.5mm}
  .kelas-txt{font-size:8.5pt;color:#666}
  /* grid 3 kolom */
  .grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:3mm;flex:1}
  .col{border-radius:7px;overflow:hidden;display:flex;flex-direction:column}
  /* col headers */
  .col-hdr{padding:2.5mm;text-align:center}
  .col-hdr-title{font-size:7pt;font-weight:bold;color:#fff;letter-spacing:1.5px;text-transform:uppercase}
  .col-hdr-sub{font-size:6pt;letter-spacing:1px;text-transform:uppercase;margin-top:1px}
  /* tahfidz */
  .col-tahfidz{border:1.5px solid #B8860B}
  .col-tahfidz .col-hdr{background:linear-gradient(135deg,#78350f,#b45309)}
  .col-tahfidz .col-hdr-sub{color:#fef3c7}
  .col-tahfidz .col-body{background:#fffbeb;flex:1;padding:3mm;font-size:7.5pt;color:#78350f}
  .total-box{background:linear-gradient(135deg,#B8860B,#D4AF37);border-radius:5px;padding:2mm;text-align:center;margin-bottom:2mm}
  .total-label{font-size:5.5pt;color:#fff8e1;letter-spacing:1px;text-transform:uppercase}
  .total-num{font-size:15pt;font-weight:bold;color:#fff;line-height:1.1}
  .total-unit{font-size:6.5pt;color:#fef9c3;font-weight:bold}
  .juz-row{display:flex;align-items:center;gap:2mm;margin-bottom:1mm;font-size:7pt}
  /* non tahfidz */
  .col-non{border:1.5px solid #1a5c3a}
  .col-non .col-hdr{background:linear-gradient(135deg,#14532d,#1a5c3a)}
  .col-non .col-hdr-sub{color:#bbf7d0}
  .col-non .col-body{background:#f0fdf4;flex:1;padding:3mm;font-size:7pt;color:#14532d}
  .non-juara{font-weight:bold;display:flex;gap:2mm;align-items:flex-start;margin-bottom:1px}
  .non-detail{color:#166534;margin-left:5mm}
  .non-small{color:#6b7280;font-size:6.5pt;margin-left:5mm}
  /* kegiatan */
  .col-keg{border:1.5px solid #1e3a5f}
  .col-keg .col-hdr{background:linear-gradient(135deg,#1e3a5f,#1d4ed8)}
  .col-keg .col-hdr-sub{color:#bfdbfe}
  .col-keg .col-body{background:#eff6ff;flex:1;padding:3mm;font-size:7pt;color:#1e3a5f}
  .keg-row{display:flex;gap:2mm;margin-bottom:1.5mm;align-items:flex-start}
  .bullet{font-size:8pt;font-weight:bold;flex-shrink:0}
  .empty{color:#aaa;font-style:italic;font-size:6.5pt}
  /* motivasi */
  .motivasi{
    background:linear-gradient(135deg,#f9f6ed,#fdf8ef);
    border:1px solid #e8d5a3;border-radius:7px;padding:3mm 5mm;text-align:center
  }
  .motivasi-title{font-size:6pt;color:#B8860B;font-weight:bold;letter-spacing:2px;text-transform:uppercase;margin-bottom:1.5mm}
  .motivasi-text{font-size:7pt;color:#555;font-style:italic;line-height:1.7}
  /* footer */
  .footer{border-top:1px solid #e5e7eb;padding-top:3mm;display:flex;justify-content:space-between;align-items:center}
  .ayat{font-size:6pt;color:#aaa;font-style:italic;line-height:1.7;max-width:65%}
  .ayat-ref{color:#B8860B;display:block;margin-top:1mm}
  .tgl{font-size:6.5pt;color:#888;text-align:right}
</style>
</head>
<body>
<div class="page">
  <div class="border-outer"></div>
  <div class="border-inner"></div>
  <div class="c c-tl"></div>
  <div class="c c-tr"></div>
  <div class="c c-bl"></div>
  <div class="c c-br"></div>
  <div class="wm">MA'AHID KUDUS</div>

  <div class="content">
    <!-- Header -->
    <div>
      <img class="logo" src="/logo-maahid-sm.png" alt="Logo Ma'ahid"/>
      <div class="inst">Pondok Pesantren Ma'ahid Kudus</div>
      <div class="title">ACHIEVEMENT</div>
      <div class="divider">
        <div class="divider-line"></div>
        <span style="color:#B8860B;font-size:10pt">✦</span>
        <div class="divider-line r"></div>
      </div>
      <div class="subtitle">Catatan Prestasi &amp; Keaktifan Santri &bull; Tahun Ajaran 2025/2026</div>
    </div>

    <!-- Nama -->
    <div class="nama-box">
      <div class="diberikan">Diberikan Kepada</div>
      <div class="nama">${santri.nama}</div>
      <div class="kelas-txt">${santri.kelas?.nama || ''}</div>
    </div>

    <!-- Grid 3 kolom -->
    <div class="grid">

      <!-- Tahfidz -->
      <div class="col col-tahfidz">
        <div class="col-hdr">
          <div class="col-hdr-title">🕌 Prestasi</div>
          <div class="col-hdr-sub">Tahfidz Al-Qur'an</div>
        </div>
        <div class="col-body">
          ${hasTahfidz ? `
            <div class="total-box">
              <div class="total-label">Telah Menghafal</div>
              <div class="total-num">${totStr}</div>
              <div class="total-unit">Juz Al-Qur'an</div>
            </div>
            ${juzRows}
          ` : '<span class="empty">—</span>'}
        </div>
      </div>

      <!-- Non Tahfidz -->
      <div class="col col-non">
        <div class="col-hdr">
          <div class="col-hdr-title">🏆 Prestasi</div>
          <div class="col-hdr-sub">Non Tahfidz</div>
        </div>
        <div class="col-body">
          ${hasNon ? nonRows : '<span class="empty">—</span>'}
        </div>
      </div>

      <!-- Kegiatan -->
      <div class="col col-keg">
        <div class="col-hdr">
          <div class="col-hdr-title">⭐ Participated</div>
          <div class="col-hdr-sub">Activities</div>
        </div>
        <div class="col-body">
          ${hasKegiatan ? kegRows : '<span class="empty">—</span>'}
        </div>
      </div>
    </div>

    <!-- Motivasi orang tua -->
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

// ─── Preview card (React, untuk tampilan web) ─────────────────
function PreviewCard({ item, motivasi, tanggal }: { item: SantriItem; motivasi: string; tanggal: string }) {
  const html = buildCardHTML(item, motivasi, tanggal)
  if (!html) return (
    <div style={{width:'210mm',minHeight:'80mm',display:'flex',alignItems:'center',justifyContent:'center',
      border:'1px dashed #ccc',borderRadius:8,color:'#aaa',fontSize:13}}>
      {item.santri.nama} — tidak ada data prestasi
    </div>
  )
  return (
    <iframe
      srcDoc={html}
      style={{width:'210mm',minHeight:'297mm',border:'none',display:'block'}}
      scrolling="no"
      title={`achievement-${item.santri.nama}`}
    />
  )
}

// ─── Generate & download ZIP PDF via print window ─────────────
function downloadAllPDF(data: SantriItem[], tanggal: string, kelasNama: string) {
  // Buat satu window dengan semua halaman, user tinggal Save as PDF
  const pages = data
    .map((item, i) => buildCardHTML(item, MOTIVASI[i % MOTIVASI.length], tanggal))
    .filter(Boolean)

  if (!pages.length) { alert('Tidak ada data untuk dicetak'); return }

  // Gabung semua halaman dalam satu dokumen print
  const combined = `
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8"/>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  @page{size:A4 portrait;margin:0}
  body{background:#fff}
  .page-wrapper{page-break-after:always}
  .page-wrapper:last-child{page-break-after:avoid}
</style>
</head>
<body>
${pages.map(p => {
  // Ambil konten dalam <body> saja
  const bodyMatch = p.match(/<body>([\s\S]*)<\/body>/)
  const inner = bodyMatch ? bodyMatch[1] : p
  return `<div class="page-wrapper">${inner}</div>`
}).join('\n')}
</body>
</html>`

  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) { alert('Pop-up diblokir browser. Izinkan pop-up untuk fitur ini.'); return }

  // Inject CSS dari setiap halaman (ambil dari halaman pertama)
  const styleMatch = pages[0].match(/<style>([\s\S]*?)<\/style>/)
  const css = styleMatch ? styleMatch[1] : ''

  win.document.write(`
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8"/>
<title>Achievement ${kelasNama}</title>
<style>
  ${css}
  *{box-sizing:border-box;margin:0;padding:0}
  @page{size:A4 portrait;margin:0}
  body{background:#fff}
  .page-wrapper{page-break-after:always;overflow:hidden}
  .page-wrapper:last-child{page-break-after:avoid}
</style>
</head>
<body>
${pages.map(p => {
  const bodyMatch = p.match(/<body>([\s\S]*?)<\/body>/)
  const inner = bodyMatch ? bodyMatch[1] : p
  return `<div class="page-wrapper">${inner}</div>`
}).join('\n')}
<script>
  // Auto print setelah semua gambar load
  window.onload = function() {
    setTimeout(function() { window.print(); }, 800)
  }
<\/script>
</body>
</html>`)
  win.document.close()
}

// ─── Halaman utama ─────────────────────────────────────────────
export default function AchievementPage() {
  const params      = useSearchParams()
  const initKelasId = params.get('kelas_id') || ''

  const [kelasList,    setKelasList]    = useState<Kelas[]>([])
  const [activeKelasId,setActiveKelasId]= useState(initKelasId)
  const [data,         setData]         = useState<SantriItem[]>([])
  const [loading,      setLoading]      = useState(false)
  const tanggal = todayKudus()

  useEffect(() => {
    fetch('/api/kelas').then(r=>r.json()).then((k: Kelas[]) => {
      setKelasList(k)
      if (!activeKelasId && k.length) setActiveKelasId(k[0].id)
    })
  }, [])

  useEffect(() => {
    if (!activeKelasId) return
    setLoading(true)
    fetch(`/api/prestasi/achievement?kelas_id=${activeKelasId}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [activeKelasId])

  const kelasNama  = kelasList.find(k => k.id === activeKelasId)?.nama || ''
  const adaData    = data.filter(item => {
    const p = item.prestasi
    if (!p) return false
    return (p.prestasi_tahfidz?.length || 0) > 0 ||
           (p.prestasi_non_tahfidz?.length || 0) > 0 ||
           p.kegiatan_sekolah || p.kegiatan_pondok
  })

  const handleCetak = useCallback(() => {
    downloadAllPDF(data, tanggal, kelasNama)
  }, [data, tanggal, kelasNama])

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <Link href="/admin/prestasi" className="btn text-sm">← Kembali</Link>
          <div>
            <h1 className="text-lg font-semibold">Cetak Achievement</h1>
            <p className="text-xs text-gray-400">{kelasNama} · {adaData.length} santri ada data · {tanggal}</p>
          </div>
        </div>
        <button onClick={handleCetak} disabled={loading || adaData.length === 0}
          className="btn btn-primary text-sm disabled:opacity-50">
          🖨 Cetak Semua → PDF
        </button>
      </div>

      {/* Pilih kelas */}
      <div className="px-6 py-4 flex gap-2 flex-wrap bg-white border-b border-gray-100">
        {kelasList.map(k => (
          <button key={k.id} onClick={() => setActiveKelasId(k.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors
              ${activeKelasId === k.id
                ? 'bg-emerald-600 text-white border-emerald-700'
                : 'bg-white border-gray-200 text-gray-600 hover:border-emerald-300'}`}>
            {k.nama}
          </button>
        ))}
      </div>

      {/* Info */}
      {!loading && data.length > 0 && (
        <div className="px-6 pt-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
            <strong>{adaData.length}</strong> dari {data.length} santri memiliki data.
            Klik <strong>"Cetak Semua → PDF"</strong> → di dialog print pilih <strong>Save as PDF</strong>.
            Setiap santri = 1 halaman A4.
            {data.length - adaData.length > 0 && (
              <span className="text-amber-600"> · {data.length - adaData.length} santri tanpa data tidak dicetak.</span>
            )}
          </div>
        </div>
      )}

      {loading && (
        <div className="py-24 text-center text-gray-400">Memuat data santri...</div>
      )}

      {/* Preview grid */}
      <div className="px-6 py-6 space-y-8">
        {data.map((item, i) => (
          <div key={item.santri.id}>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-medium text-gray-600">{item.santri.nama}</span>
              {!item.prestasi || (
                (item.prestasi.prestasi_tahfidz?.length || 0) === 0 &&
                (item.prestasi.prestasi_non_tahfidz?.length || 0) === 0 &&
                !item.prestasi.kegiatan_sekolah &&
                !item.prestasi.kegiatan_pondok
              ) ? (
                <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Tidak ada data — tidak dicetak</span>
              ) : (
                <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">✓ Akan dicetak</span>
              )}
            </div>
            <div className="shadow-xl rounded-sm overflow-hidden" style={{width:'210mm'}}>
              <PreviewCard item={item} motivasi={MOTIVASI[i % MOTIVASI.length]} tanggal={tanggal}/>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
