import { NextRequest, NextResponse } from 'next/server'
import { clearAdminCookie, isAdminFromRequest } from '@/lib/auth'

// GET /api/auth/session - cek apakah sudah login
export async function GET(req: NextRequest) {
  const ok = await isAdminFromRequest(req)
  return NextResponse.json({ isAdmin: ok })
}

// DELETE /api/auth/session - logout
export async function DELETE() {
  clearAdminCookie()
  return NextResponse.json({ ok: true })
}
