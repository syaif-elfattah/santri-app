'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

const NAV = [
  { href: '/admin/dashboard',          label: 'Dashboard',         icon: '📊' },
  { href: '/admin/kelas',              label: 'Kelas',             icon: '🏫' },
  { href: '/admin/musyrif',            label: 'Musyrif',           icon: '👤' },
  { href: '/admin/santri',             label: 'Data Santri',       icon: '👥' },
  { href: '/admin/prestasi',           label: 'Prestasi',          icon: '🏆' },
  { href: '/admin/tahun-ajaran',       label: 'Tahun Ajaran',      icon: '📅' },
  { href: '/admin/achievement-config', label: 'Desain Achievement', icon: '🎨' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [checked, setChecked] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (pathname === '/admin') { setChecked(true); return }
    fetch('/api/auth/session').then(r => r.json()).then(d => {
      if (!d.isAdmin) router.replace('/admin')
      else setChecked(true)
    })
  }, [pathname, router])

  const logout = async () => {
    await fetch('/api/auth/session', { method: 'DELETE' })
    router.replace('/admin')
  }

  if (!checked) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400 text-sm">Memeriksa sesi...</p>
    </div>
  )

  if (pathname === '/admin') return <>{children}</>

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setOpen(!open)} className="md:hidden text-gray-500">☰</button>
          <span className="font-medium text-gray-800 text-sm">Panel Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <a href="/api/prestasi/export"
            className="btn text-xs hidden sm:inline-flex items-center gap-1">
            ⬇ Ekspor Excel
          </a>
          <button onClick={logout} className="btn btn-danger text-xs">Keluar</button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className={`
          fixed md:static inset-y-0 left-0 z-40 w-52 bg-white border-r border-gray-100
          transform transition-transform md:transform-none
          ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          pt-16 md:pt-0 flex flex-col
        `}>
          <nav className="flex-1 p-3 space-y-1 mt-2">
            {NAV.map(n => (
              <Link key={n.href} href={n.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
                  ${pathname === n.href
                    ? 'bg-purple-50 text-purple-700 font-medium'
                    : 'text-gray-600 hover:bg-gray-50'}`}>
                <span>{n.icon}</span>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="p-3 border-t border-gray-100">
            <Link href="/" className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-gray-600">
              ← Ke beranda
            </Link>
          </div>
        </aside>

        {/* Overlay mobile */}
        {open && (
          <div className="fixed inset-0 z-30 bg-black/20 md:hidden"
            onClick={() => setOpen(false)} />
        )}

        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
