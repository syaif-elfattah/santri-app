import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || 'fallback-secret-ganti-ini'
)
const COOKIE = 'santri_admin_session'

// Rate limit store (in-memory, per edge instance)
const store = new Map<string, { count: number; resetAt: number }>()

function rateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = store.get(ip)
  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + 60_000 })
    return true
  }
  entry.count++
  return entry.count <= 120
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Rate limiting
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (!rateLimit(ip)) {
    return new NextResponse(
      JSON.stringify({ error: 'Terlalu banyak request. Coba lagi dalam 1 menit.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Guard halaman admin (kecuali halaman login /admin itu sendiri)
  if (pathname.startsWith('/admin/') && pathname !== '/admin/') {
    const token = req.cookies.get(COOKIE)?.value
    if (!token) {
      return NextResponse.redirect(new URL('/admin', req.url))
    }
    try {
      const { payload } = await jwtVerify(token, SECRET)
      if (payload.role !== 'admin') {
        return NextResponse.redirect(new URL('/admin', req.url))
      }
    } catch {
      return NextResponse.redirect(new URL('/admin', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path+',
    '/api/:path*',
  ],
}
