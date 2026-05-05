'use client'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🕌</span>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">Database Santri</h1>
          <p className="text-gray-500 text-sm mt-1">Prestasi &amp; Keaktifan Santri</p>
        </div>

        <div className="card space-y-3">
          <Link href="/input"
            className="flex items-center gap-4 p-4 rounded-xl border border-gray-100
                       hover:border-emerald-200 hover:bg-emerald-50 transition-all group">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center
                            group-hover:bg-emerald-200 transition-colors flex-shrink-0">
              <span className="text-xl">✏️</span>
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">Input Prestasi &amp; Keaktifan</p>
              <p className="text-xs text-gray-400 mt-0.5">Untuk musyrif — tidak perlu login</p>
            </div>
            <span className="ml-auto text-gray-300 group-hover:text-emerald-400">→</span>
          </Link>

          <Link href="/admin"
            className="flex items-center gap-4 p-4 rounded-xl border border-gray-100
                       hover:border-purple-200 hover:bg-purple-50 transition-all group">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center
                            group-hover:bg-purple-200 transition-colors flex-shrink-0">
              <span className="text-xl">🔐</span>
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">Panel Admin</p>
              <p className="text-xs text-gray-400 mt-0.5">Kelola data santri, rekap, ekspor</p>
            </div>
            <span className="ml-auto text-gray-300 group-hover:text-purple-400">→</span>
          </Link>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Pondok Pesantren · Sistem Pendataan Santri
        </p>
      </div>
    </main>
  )
}
