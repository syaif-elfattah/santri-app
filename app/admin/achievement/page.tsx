'use client'
import { useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

type Kelas = { id: string; nama: string }
type Santri = { id: string; nama: string; no_urut: number; kelas: { nama: string } }
type JuzEntry = { juz: number; level: number }
type NonTahfidz = { juara: string; cabang: string; penyelenggara: string; bulan_tahun: string }
type Prestasi = {
  kegiatan_sekolah: string; kegiatan_pondok: string
  prestasi_tahfidz: JuzEntry[]; prestasi_non_tahfidz: NonTahfidz[]
  progres_pribadi: string
}
type SantriData = { santri: Santri; prestasi: Prestasi | null }

const JUZ_LABEL: Record<number,string> = { 1:'', 2:'¾', 3:'½', 4:'¼' }

function AchievementCard({ item }: { item: SantriData }) {
  const { santri, prestasi } = item
  const kegiatanAll = [
    ...(prestasi?.kegiatan_sekolah?.split('\n').filter(Boolean) || []),
    ...(prestasi?.kegiatan_pondok?.split('\n').filter(Boolean) || [])
  ]

  return (
    <div className="achievement-card" style={{
      width:'210mm', minHeight:'297mm', padding:'14mm',
      fontFamily:'Georgia, serif', background:'#fff',
      position:'relative', overflow:'hidden', boxSizing:'border-box',
      pageBreakAfter:'always'
    }}>
      {/* Background ornament */}
      <div style={{position:'absolute',top:0,left:0,right:0,bottom:0,pointerEvents:'none',zIndex:0}}>
        {/* Corner ornaments */}
        {['top:8mm;left:8mm','top:8mm;right:8mm','bottom:8mm;left:8mm','bottom:8mm;right:8mm'].map((pos,i)=>(
          <div key={i} style={{position:'absolute',...Object.fromEntries(pos.split(';').map(p=>{const[k,v]=p.split(':');return[k.trim(),v.trim()]})),
            width:'20mm',height:'20mm',
            borderTop:i<2?'3px solid #B8860B':'none',
            borderBottom:i>=2?'3px solid #B8860B':'none',
            borderLeft:i%2===0?'3px solid #B8860B':'none',
            borderRight:i%2===1?'3px solid #B8860B':'none'
          }}/>
        ))}
        {/* Watermark pattern */}
        <div style={{position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%) rotate(-30deg)',
          fontSize:'80px',opacity:0.03,color:'#1a5c3a',fontWeight:'bold',whiteSpace:'nowrap',letterSpacing:'10px'}}>
          MA'AHID KUDUS
        </div>
      </div>

      {/* Content */}
      <div style={{position:'relative',zIndex:1,height:'100%',display:'flex',flexDirection:'column',gap:'6mm'}}>

        {/* Header */}
        <div style={{textAlign:'center',borderBottom:'2px solid #B8860B',paddingBottom:'5mm'}}>
          <div style={{fontSize:'9pt',letterSpacing:'4px',color:'#666',textTransform:'uppercase',marginBottom:'2mm'}}>
            Pondok Pesantren Ma'ahid Kudus
          </div>
          <div style={{fontSize:'22pt',fontWeight:'bold',color:'#1a3a2a',letterSpacing:'2px',marginBottom:'2mm'}}>
            ACHIEVEMENT
          </div>
          <div style={{fontSize:'9pt',color:'#888',fontStyle:'italic'}}>
            Catatan Prestasi & Keaktifan Santri · Tahun Ajaran 2025/2026
          </div>
        </div>

        {/* Nama & Kelas */}
        <div style={{textAlign:'center',background:'linear-gradient(135deg,#f0f7f0,#e8f5e9)',
          border:'1px solid #a5d6a7',borderRadius:'8px',padding:'5mm'}}>
          <div style={{fontSize:'8pt',color:'#666',letterSpacing:'3px',textTransform:'uppercase',marginBottom:'1mm'}}>Diberikan kepada</div>
          <div style={{fontSize:'18pt',fontWeight:'bold',color:'#1a5c3a',marginBottom:'1mm'}}>{santri.nama}</div>
          <div style={{fontSize:'9pt',color:'#555'}}>{santri.kelas?.nama} &nbsp;·&nbsp; No. {santri.no_urut}</div>
        </div>

        {/* Grid 3 kolom */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:'4mm',flex:1}}>

          {/* Prestasi Tahfidz */}
          <div style={{border:'1.5px solid #B8860B',borderRadius:'8px',overflow:'hidden',display:'flex',flexDirection:'column'}}>
            <div style={{background:'linear-gradient(135deg,#92400e,#B8860B)',padding:'3mm',textAlign:'center'}}>
              <div style={{fontSize:'7pt',color:'#fff',letterSpacing:'2px',textTransform:'uppercase',fontWeight:'bold'}}>🕌 Prestasi</div>
              <div style={{fontSize:'7pt',color:'#fef3c7',letterSpacing:'1px',textTransform:'uppercase'}}>Tahfidz Al-Qur'an</div>
            </div>
            <div style={{padding:'3mm',flex:1,fontSize:'8pt',lineHeight:'1.6',color:'#3d1a00'}}>
              {prestasi?.prestasi_tahfidz?.length ? (
                prestasi.prestasi_tahfidz.map((j,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:'2mm',marginBottom:'1mm'}}>
                    <span style={{color:'#B8860B',fontWeight:'bold'}}>✦</span>
                    <span>Juz {j.juz} {JUZ_LABEL[j.level] ? `(${JUZ_LABEL[j.level]})`:''}</span>
                  </div>
                ))
              ) : <span style={{color:'#aaa',fontStyle:'italic',fontSize:'7pt'}}>—</span>}
            </div>
          </div>

          {/* Prestasi Non Tahfidz */}
          <div style={{border:'1.5px solid #1a5c3a',borderRadius:'8px',overflow:'hidden',display:'flex',flexDirection:'column'}}>
            <div style={{background:'linear-gradient(135deg,#14532d,#1a5c3a)',padding:'3mm',textAlign:'center'}}>
              <div style={{fontSize:'7pt',color:'#fff',letterSpacing:'2px',textTransform:'uppercase',fontWeight:'bold'}}>🏆 Prestasi</div>
              <div style={{fontSize:'7pt',color:'#bbf7d0',letterSpacing:'1px',textTransform:'uppercase'}}>Non Tahfidz</div>
            </div>
            <div style={{padding:'3mm',flex:1,fontSize:'8pt',lineHeight:'1.6',color:'#14532d'}}>
              {prestasi?.prestasi_non_tahfidz?.length ? (
                prestasi.prestasi_non_tahfidz.map((n,i)=>(
                  <div key={i} style={{marginBottom:'2mm',paddingBottom:'2mm',borderBottom:i<prestasi.prestasi_non_tahfidz.length-1?'1px solid #dcfce7':'none'}}>
                    <div style={{fontWeight:'bold',fontSize:'8pt'}}>✦ {n.juara}</div>
                    <div style={{color:'#166534',fontSize:'7pt'}}>{n.cabang}</div>
                    <div style={{color:'#888',fontSize:'7pt'}}>{n.penyelenggara}</div>
                    <div style={{color:'#999',fontSize:'7pt'}}>{n.bulan_tahun}</div>
                  </div>
                ))
              ) : <span style={{color:'#aaa',fontStyle:'italic',fontSize:'7pt'}}>—</span>}
            </div>
          </div>

          {/* Participated Activities */}
          <div style={{border:'1.5px solid #1e3a5f',borderRadius:'8px',overflow:'hidden',display:'flex',flexDirection:'column'}}>
            <div style={{background:'linear-gradient(135deg,#1e3a5f,#2563eb)',padding:'3mm',textAlign:'center'}}>
              <div style={{fontSize:'7pt',color:'#fff',letterSpacing:'2px',textTransform:'uppercase',fontWeight:'bold'}}>⭐ Participated</div>
              <div style={{fontSize:'7pt',color:'#bfdbfe',letterSpacing:'1px',textTransform:'uppercase'}}>Activities</div>
            </div>
            <div style={{padding:'3mm',flex:1,fontSize:'8pt',lineHeight:'1.6',color:'#1e3a5f'}}>
              {kegiatanAll.length ? (
                kegiatanAll.map((k,i)=>(
                  <div key={i} style={{display:'flex',gap:'2mm',marginBottom:'1mm'}}>
                    <span style={{color:'#2563eb',fontWeight:'bold'}}>✦</span>
                    <span>{k.replace(/^•\s*/,'')}</span>
                  </div>
                ))
              ) : <span style={{color:'#aaa',fontStyle:'italic',fontSize:'7pt'}}>—</span>}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{borderTop:'1px solid #e0e0e0',paddingTop:'4mm',display:'flex',justifyContent:'space-between',alignItems:'flex-end'}}>
          <div style={{fontSize:'7pt',color:'#999',fontStyle:'italic',maxWidth:'60%',lineHeight:'1.5'}}>
            "Dan barangsiapa yang bersungguh-sungguh di jalan Kami, maka Kami akan tunjukkan kepada mereka jalan-jalan Kami."
            <br/><span style={{color:'#bbb'}}>(QS. Al-Ankabut: 69)</span>
          </div>
          <div style={{textAlign:'center'}}>
            <div style={{width:'30mm',borderTop:'1px solid #333',marginBottom:'1mm'}}/>
            <div style={{fontSize:'7pt',color:'#555'}}>Musyrif / Musyrifah</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AchievementPage() {
  const params = useSearchParams()
  const kelasId = params.get('kelas_id')
  const [kelasList, setKelasList] = useState<Kelas[]>([])
  const [activeKelasId, setActiveKelasId] = useState(kelasId||'')
  const [data, setData] = useState<SantriData[]>([])
  const [loading, setLoading] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(()=>{
    fetch('/api/kelas').then(r=>r.json()).then((k:Kelas[])=>{ setKelasList(k); if(!activeKelasId&&k.length) setActiveKelasId(k[0].id) })
  },[])

  useEffect(()=>{
    if(!activeKelasId) return
    setLoading(true)
    fetch(`/api/prestasi/achievement?kelas_id=${activeKelasId}`)
      .then(r=>r.json()).then(d=>{ setData(d); setLoading(false) })
  },[activeKelasId])

  const handlePrint = () => {
    const style = `
      @media print {
        body * { visibility: hidden; }
        #print-area, #print-area * { visibility: visible; }
        #print-area { position: absolute; top: 0; left: 0; width: 100%; }
        .achievement-card { page-break-after: always; margin: 0; }
        @page { size: A4; margin: 0; }
      }
    `
    const styleEl = document.createElement('style')
    styleEl.innerHTML = style
    document.head.appendChild(styleEl)
    window.print()
    document.head.removeChild(styleEl)
  }

  const kelasNama = kelasList.find(k=>k.id===activeKelasId)?.nama || ''

  return (
    <div>
      <div className="flex items-center justify-between mb-6 no-print">
        <div>
          <h1 className="text-xl font-semibold">Cetak Achievement</h1>
          <p className="text-sm text-gray-400 mt-0.5">Preview & cetak sertifikat pencapaian per santri</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/prestasi" className="btn text-sm">← Kembali</Link>
          <button onClick={handlePrint} className="btn btn-primary text-sm">🖨 Cetak Semua (PDF)</button>
        </div>
      </div>

      {/* Pilih kelas */}
      <div className="flex gap-2 mb-6 no-print flex-wrap">
        {kelasList.map(k=>(
          <button key={k.id} onClick={()=>setActiveKelasId(k.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors
              ${activeKelasId===k.id?'bg-emerald-600 text-white border-emerald-700':'bg-white border-gray-200 text-gray-600 hover:border-emerald-300'}`}>
            {k.nama}
          </button>
        ))}
      </div>

      {loading && <div className="py-12 text-center text-gray-400">Memuat data...</div>}

      {/* Info */}
      {!loading && data.length>0 && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg no-print">
          <p className="text-sm text-amber-700">
            <strong>{data.length} santri</strong> · {kelasNama} ·
            Klik "Cetak Semua" untuk save sebagai PDF, atau Ctrl+P
          </p>
        </div>
      )}

      {/* Preview cards */}
      <div id="print-area" ref={printRef}>
        {data.map((item,i)=>(
          <div key={i} className="mb-8 shadow-lg no-print-shadow">
            <AchievementCard item={item} />
          </div>
        ))}
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .no-print-shadow { box-shadow: none !important; margin: 0 !important; }
          body { background: white; }
        }
      `}</style>
    </div>
  )
}
