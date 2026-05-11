'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

type Kelas    = { id: string; nama: string }
type Santri   = { id: string; nama: string; no_urut: number; kelas: { nama: string } }
type JuzEntry = { juz: number; level: number }
type NonTahfidz = { juara: string; cabang: string; penyelenggara: string; bulan_tahun: string }
type Prestasi = {
  kegiatan_sekolah: string; kegiatan_pondok: string
  prestasi_tahfidz: JuzEntry[]; prestasi_non_tahfidz: NonTahfidz[]
  progres_pribadi: string
}
type SantriData = { santri: Santri; prestasi: Prestasi | null }

const JUZ_LEVEL_VAL: Record<number,number> = { 1:1, 2:0.75, 3:0.5, 4:0.25 }
const JUZ_LEVEL_LABEL: Record<number,string> = { 1:'', 2:'(¾)', 3:'(½)', 4:'(¼)' }

const MOTIVASI_ORTU = [
  "Ayah & Bunda, setiap doa yang kalian panjatkan untuk buah hati adalah investasi terbaik yang tidak ternilai harganya. Teruslah hadir, teruslah mendukung — karena kehadiran kalian adalah energi terbesar bagi perjalanan ananda.",
  "Terima kasih, Ayah & Bunda, telah mempercayakan ananda kepada kami. Setiap langkah kecil yang ananda tempuh adalah buah dari kasih sayang dan doa kalian yang tiada putus.",
  "Ayah & Bunda yang luar biasa, prestasi bukan hanya tentang angka dan piala — tetapi tentang karakter yang tumbuh, akhlak yang terbentuk, dan hati yang semakin dekat kepada Allah. Ananda sedang dalam perjalanan indah itu.",
]

function hitungTotalJuz(tahfidz: JuzEntry[]): number {
  return tahfidz.reduce((sum, j) => sum + (JUZ_LEVEL_VAL[j.level] || 0), 0)
}

function formatTotalJuz(total: number): string {
  if (total === 0) return '0'
  const whole = Math.floor(total)
  const frac = total - whole
  if (frac === 0) return `${whole}`
  if (Math.abs(frac - 0.75) < 0.01) return whole > 0 ? `${whole}¾` : '¾'
  if (Math.abs(frac - 0.5)  < 0.01) return whole > 0 ? `${whole}½` : '½'
  if (Math.abs(frac - 0.25) < 0.01) return whole > 0 ? `${whole}¼` : '¼'
  return total.toFixed(2)
}

// ─── Kartu Achievement (A4, inline style untuk print) ─────────
function AchievementCard({ item, motivasi }: { item: SantriData; motivasi: string }) {
  const { santri, prestasi } = item

  const kegiatanAll = [
    ...(prestasi?.kegiatan_sekolah?.split('\n').filter(Boolean) || []),
    ...(prestasi?.kegiatan_pondok?.split('\n').filter(Boolean) || []),
  ]

  const tahfidz = prestasi?.prestasi_tahfidz || []
  const totalJuz = hitungTotalJuz(tahfidz)
  const totalJuzStr = formatTotalJuz(totalJuz)
  const juzList = [...tahfidz].sort((a,b)=>a.juz-b.juz)

  const nonTahfidz = prestasi?.prestasi_non_tahfidz || []

  // Border emas ornamen corners
  const cornerStyle = (pos: React.CSSProperties): React.CSSProperties => ({
    position:'absolute', width:28, height:28,
    borderColor:'#B8860B', borderStyle:'solid', ...pos
  })

  return (
    <div style={{
      width:'210mm', minHeight:'297mm', background:'#fff',
      fontFamily:'"Georgia", "Times New Roman", serif',
      position:'relative', pageBreakAfter:'always', overflow:'hidden',
      boxSizing:'border-box', display:'flex', flexDirection:'column',
    }}>
      {/* Outer border gold */}
      <div style={{position:'absolute',inset:10,border:'2.5px solid #B8860B',borderRadius:4,zIndex:1,pointerEvents:'none'}}/>
      {/* Inner border gold */}
      <div style={{position:'absolute',inset:15,border:'1px solid #D4AF37',borderRadius:2,zIndex:1,pointerEvents:'none'}}/>

      {/* Corner ornaments */}
      <div style={cornerStyle({top:6,left:6,borderTopWidth:4,borderLeftWidth:4,borderRight:'none',borderBottom:'none'})}/>
      <div style={cornerStyle({top:6,right:6,borderTopWidth:4,borderRightWidth:4,borderLeft:'none',borderBottom:'none'})}/>
      <div style={cornerStyle({bottom:6,left:6,borderBottomWidth:4,borderLeftWidth:4,borderRight:'none',borderTop:'none'})}/>
      <div style={cornerStyle({bottom:6,right:6,borderBottomWidth:4,borderRightWidth:4,borderLeft:'none',borderTop:'none'})}/>

      {/* Watermark pattern background */}
      <div style={{
        position:'absolute',inset:0,
        backgroundImage:'radial-gradient(circle, #B8860B08 1px, transparent 1px)',
        backgroundSize:'20px 20px', zIndex:0, pointerEvents:'none'
      }}/>

      {/* Content */}
      <div style={{position:'relative',zIndex:2,padding:'22mm 18mm 14mm',flex:1,display:'flex',flexDirection:'column',gap:'5mm'}}>

        {/* Logo + Header */}
        <div style={{textAlign:'center'}}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-maahid-sm.png" alt="Logo Ma'ahid"
            style={{width:70,height:70,objectFit:'contain',margin:'0 auto 4mm'}}/>
          <div style={{fontSize:'8pt',letterSpacing:'3px',color:'#666',textTransform:'uppercase',marginBottom:'1mm'}}>
            Pondok Pesantren Ma'ahid Kudus
          </div>
          <div style={{
            fontSize:'26pt',fontWeight:'bold',color:'#1a3a2a',
            letterSpacing:'4px',textTransform:'uppercase',marginBottom:'1mm',
            textShadow:'0 1px 2px rgba(0,0,0,0.08)'
          }}>
            ACHIEVEMENT
          </div>
          {/* Divider ornament */}
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'6px',margin:'1mm 0 2mm'}}>
            <div style={{height:1,width:40,background:'linear-gradient(to right,transparent,#B8860B)'}}/>
            <span style={{color:'#B8860B',fontSize:'10pt'}}>✦</span>
            <div style={{height:1,width:40,background:'linear-gradient(to left,transparent,#B8860B)'}}/>
          </div>
          <div style={{fontSize:'8pt',color:'#888',fontStyle:'italic'}}>
            Catatan Prestasi &amp; Keaktifan Santri · Tahun Ajaran 2025/2026
          </div>
        </div>

        {/* Nama santri */}
        <div style={{
          textAlign:'center',
          background:'linear-gradient(135deg,#f9f6ed,#fdf8ef)',
          border:'1.5px solid #D4AF37',borderRadius:8,padding:'5mm 8mm',
          boxShadow:'0 2px 8px rgba(184,134,11,0.1)'
        }}>
          <div style={{fontSize:'7.5pt',color:'#999',letterSpacing:'3px',textTransform:'uppercase',marginBottom:'2mm'}}>
            Diberikan Kepada
          </div>
          <div style={{fontSize:'20pt',fontWeight:'bold',color:'#1a5c3a',marginBottom:'1.5mm',letterSpacing:'0.5px'}}>
            {santri.nama}
          </div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:8,fontSize:'8.5pt',color:'#666'}}>
            <span>{santri.kelas?.nama}</span>
            <span style={{color:'#B8860B'}}>·</span>
            <span>Nomor Urut {santri.no_urut}</span>
          </div>
        </div>

        {/* Grid 3 kolom prestasi */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'4mm',flex:1}}>

          {/* Kolom 1: Tahfidz */}
          <div style={{border:'1.5px solid #B8860B',borderRadius:8,overflow:'hidden',display:'flex',flexDirection:'column'}}>
            <div style={{background:'linear-gradient(135deg,#78350f,#b45309)',padding:'3mm',textAlign:'center'}}>
              <div style={{fontSize:'7pt',fontWeight:'bold',color:'#fff',letterSpacing:'1.5px',textTransform:'uppercase'}}>🕌 Prestasi</div>
              <div style={{fontSize:'6.5pt',color:'#fef3c7',letterSpacing:'1px',textTransform:'uppercase'}}>Tahfidz Al-Qur'an</div>
            </div>
            <div style={{padding:'3mm 3mm 2mm',background:'#fffbeb',flex:1,display:'flex',flexDirection:'column',gap:'2mm'}}>
              {totalJuz > 0 ? (
                <>
                  {/* Total box */}
                  <div style={{
                    background:'linear-gradient(135deg,#B8860B,#D4AF37)',
                    borderRadius:6,padding:'2mm 3mm',textAlign:'center',marginBottom:'2mm'
                  }}>
                    <div style={{fontSize:'6pt',color:'#fff8e1',letterSpacing:'1px',textTransform:'uppercase'}}>Telah menghafal</div>
                    <div style={{fontSize:'16pt',fontWeight:'bold',color:'#fff',lineHeight:1.1}}>{totalJuzStr}</div>
                    <div style={{fontSize:'7pt',color:'#fef9c3',fontWeight:'bold'}}>Juz Al-Qur'an</div>
                  </div>
                  {/* Rincian */}
                  <div style={{flex:1}}>
                    {juzList.map((j,i)=>(
                      <div key={i} style={{display:'flex',alignItems:'center',gap:'2mm',marginBottom:'1mm',fontSize:'7.5pt',color:'#78350f'}}>
                        <span style={{color:'#B8860B',fontWeight:'bold',fontSize:'8pt'}}>✦</span>
                        <span>Juz {j.juz} {JUZ_LEVEL_LABEL[j.level]}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <span style={{color:'#d6b87a',fontStyle:'italic',fontSize:'7pt'}}>—</span>
              )}
            </div>
          </div>

          {/* Kolom 2: Non Tahfidz */}
          <div style={{border:'1.5px solid #1a5c3a',borderRadius:8,overflow:'hidden',display:'flex',flexDirection:'column'}}>
            <div style={{background:'linear-gradient(135deg,#14532d,#1a5c3a)',padding:'3mm',textAlign:'center'}}>
              <div style={{fontSize:'7pt',fontWeight:'bold',color:'#fff',letterSpacing:'1.5px',textTransform:'uppercase'}}>🏆 Prestasi</div>
              <div style={{fontSize:'6.5pt',color:'#bbf7d0',letterSpacing:'1px',textTransform:'uppercase'}}>Non Tahfidz</div>
            </div>
            <div style={{padding:'3mm',background:'#f0fdf4',flex:1,fontSize:'7.5pt',lineHeight:1.6,color:'#14532d'}}>
              {nonTahfidz.length ? nonTahfidz.map((n,i)=>(
                <div key={i} style={{marginBottom:'3mm',paddingBottom:'2mm',borderBottom:i<nonTahfidz.length-1?'1px solid #dcfce7':'none'}}>
                  <div style={{fontWeight:'bold',color:'#14532d',display:'flex',alignItems:'center',gap:'2mm'}}>
                    <span style={{color:'#1a5c3a',fontSize:'8pt'}}>✦</span>{n.juara}
                  </div>
                  <div style={{color:'#166534',fontSize:'7pt',marginLeft:'6mm'}}>{n.cabang}</div>
                  <div style={{color:'#6b7280',fontSize:'6.5pt',marginLeft:'6mm'}}>{n.penyelenggara}</div>
                  <div style={{color:'#9ca3af',fontSize:'6.5pt',marginLeft:'6mm'}}>{n.bulan_tahun}</div>
                </div>
              )) : <span style={{color:'#86efac',fontStyle:'italic',fontSize:'7pt'}}>—</span>}
            </div>
          </div>

          {/* Kolom 3: Participated Activities */}
          <div style={{border:'1.5px solid #1e3a5f',borderRadius:8,overflow:'hidden',display:'flex',flexDirection:'column'}}>
            <div style={{background:'linear-gradient(135deg,#1e3a5f,#1d4ed8)',padding:'3mm',textAlign:'center'}}>
              <div style={{fontSize:'7pt',fontWeight:'bold',color:'#fff',letterSpacing:'1.5px',textTransform:'uppercase'}}>⭐ Participated</div>
              <div style={{fontSize:'6.5pt',color:'#bfdbfe',letterSpacing:'1px',textTransform:'uppercase'}}>Activities</div>
            </div>
            <div style={{padding:'3mm',background:'#eff6ff',flex:1,fontSize:'7.5pt',lineHeight:1.6,color:'#1e3a5f'}}>
              {kegiatanAll.length ? kegiatanAll.map((k,i)=>(
                <div key={i} style={{display:'flex',gap:'2mm',marginBottom:'1.5mm'}}>
                  <span style={{color:'#1d4ed8',fontWeight:'bold',fontSize:'8pt',flexShrink:0}}>✦</span>
                  <span>{k.replace(/^•\s*/,'')}</span>
                </div>
              )) : <span style={{color:'#93c5fd',fontStyle:'italic',fontSize:'7pt'}}>—</span>}
            </div>
          </div>
        </div>

        {/* Kata motivasi untuk orangtua */}
        <div style={{
          background:'linear-gradient(135deg,#f9f6ed,#fdf8ef)',
          border:'1px solid #e8d5a3',borderRadius:8,padding:'4mm 6mm',
          textAlign:'center'
        }}>
          <div style={{fontSize:'6.5pt',color:'#B8860B',fontWeight:'bold',letterSpacing:'2px',textTransform:'uppercase',marginBottom:'2mm'}}>
            ✦ Pesan untuk Ayah &amp; Bunda ✦
          </div>
          <div style={{fontSize:'7.5pt',color:'#555',fontStyle:'italic',lineHeight:1.7}}>
            "{motivasi}"
          </div>
        </div>

        {/* Footer ayat */}
        <div style={{borderTop:'1px solid #e5e7eb',paddingTop:'3mm',textAlign:'center'}}>
          <div style={{fontSize:'6.5pt',color:'#aaa',fontStyle:'italic',lineHeight:1.7}}>
            "Dan barangsiapa yang bersungguh-sungguh di jalan Kami, maka Kami akan tunjukkan kepada mereka jalan-jalan Kami."
            <span style={{color:'#B8860B',display:'block',marginTop:'1mm'}}>(QS. Al-&#39;Ankabut: 69)</span>
          </div>
        </div>
        </div>

      </div>
    </div>
  )
}

// ─── Halaman Admin Achievement ────────────────────────────────
export default function AchievementPage() {
  const params       = useSearchParams()
  const initKelasId  = params.get('kelas_id') || ''
  const [kelasList, setKelasList]       = useState<Kelas[]>([])
  const [activeKelasId, setActiveKelasId] = useState(initKelasId)
  const [data, setData]                 = useState<SantriData[]>([])
  const [loading, setLoading]           = useState(false)

  useEffect(()=>{
    fetch('/api/kelas').then(r=>r.json()).then((k:Kelas[])=>{
      setKelasList(k)
      if(!activeKelasId && k.length) setActiveKelasId(k[0].id)
    })
  },[])

  useEffect(()=>{
    if(!activeKelasId) return
    setLoading(true)
    fetch(`/api/prestasi/achievement?kelas_id=${activeKelasId}`)
      .then(r=>r.json()).then(d=>{ setData(d); setLoading(false) })
  },[activeKelasId])

  const handlePrint = () => window.print()

  const kelasNama = kelasList.find(k=>k.id===activeKelasId)?.nama || ''

  return (
    <div>
      {/* Toolbar — hidden saat print */}
      <div className="no-print">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold">Cetak Achievement</h1>
            <p className="text-sm text-gray-400 mt-0.5">Preview sertifikat pencapaian santri · ukuran A4</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/prestasi" className="btn text-sm">← Kembali</Link>
            <button onClick={handlePrint} className="btn btn-primary text-sm">🖨 Cetak / Save PDF</button>
          </div>
        </div>

        {/* Pilih kelas */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {kelasList.map(k=>(
            <button key={k.id} onClick={()=>setActiveKelasId(k.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors
                ${activeKelasId===k.id?'bg-emerald-600 text-white border-emerald-700':'bg-white border-gray-200 text-gray-600 hover:border-emerald-300'}`}>
              {k.nama}
            </button>
          ))}
        </div>

        {!loading && data.length>0 && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-sm text-amber-700">
              <strong>{data.length} santri</strong> · {kelasNama} ·
              Klik "Cetak / Save PDF" → di dialog print pilih <strong>"Save as PDF"</strong> → setiap halaman = 1 santri
            </p>
          </div>
        )}
      </div>

      {loading && <div className="py-16 text-center text-gray-400">Memuat data santri...</div>}

      {/* Cards — ini yang dicetak */}
      <div id="print-area">
        {data.map((item,i)=>(
          <div key={i} className="mb-8 shadow-xl no-print-shadow">
            <AchievementCard item={item} motivasi={MOTIVASI_ORTU[i % MOTIVASI_ORTU.length]}/>
          </div>
        ))}
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .no-print-shadow { box-shadow: none !important; margin: 0 !important; }
          body { background: white !important; margin: 0 !important; padding: 0 !important; }
          #print-area { padding: 0 !important; }
          @page { size: A4; margin: 0; }
        }
      `}</style>
    </div>
  )
}
