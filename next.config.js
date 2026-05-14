/** @type {import('next').NextConfig} */
const nextConfig = {
  // Kompres response otomatis
  compress: true,

  // Powered by header tidak perlu
  poweredByHeader: false,

  // Security & cache headers untuk semua halaman
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options',    value: 'nosniff' },
          { key: 'X-Frame-Options',           value: 'DENY' },
          { key: 'X-XSS-Protection',          value: '1; mode=block' },
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
        ],
      },
      {
        // Cache aset statis sangat lama (logo, css, js di-hash by Next.js)
        source: '/logo-maahid:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // API public (kelas, santri, tahun-ajaran GET) - cache di CDN
        source: '/api/(kelas|santri|tahun-ajaran)',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=30, stale-while-revalidate=120' },
        ],
      },
    ]
  },

  // Image optimization
  images: {
    formats: ['image/webp'],
    minimumCacheTTL: 3600,
  },
}

module.exports = nextConfig
