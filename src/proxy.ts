import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { decryptSession, isSessionExpiringSoon, refreshSession } from '@/lib/auth/session'
import { getRouteConfig, hasRouteAccess, ROLE_HOME } from '@/lib/auth/rbac'

/**
 * Proxy (Next.js 16 — menggantikan middleware.ts) untuk RBAC dan session management.
 *
 * Alur:
 * 1. Baca session dari cookie
 * 2. Jika path dilindungi dan tidak ada session → redirect ke /login
 * 3. Jika session hampir kedaluwarsa → refresh otomatis
 * 4. Jika role tidak sesuai → redirect ke beranda role yang sesuai
 *
 * Requirements: 1.5, 1.6, 1.7, 1.8, 2.1
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl
  const routeConfig = getRouteConfig(pathname)

  // Path tidak dilindungi — lewati
  if (!routeConfig) return NextResponse.next()

  const token = request.cookies.get('session')?.value
  const session = token ? await decryptSession(token) : null

  // Tidak ada session atau sudah kedaluwarsa → redirect ke /login (Req 1.6)
  if (!session) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Akun tidak aktif
  if (!session.isActive) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Role tidak sesuai → redirect ke beranda role yang benar (Req 1.8)
  if (!hasRouteAccess(session.role, routeConfig)) {
    return NextResponse.redirect(new URL(ROLE_HOME[session.role], request.url))
  }

  // Auto-refresh session jika hampir kedaluwarsa (Req 1.5)
  const response = NextResponse.next()
  if (isSessionExpiringSoon(session)) {
    await refreshSession(session)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Cocokkan semua path kecuali:
     * - /login, /api/auth/* (auth endpoints publik)
     * - _next/static, _next/image (aset statis)
     * - favicon.ico, file publik
     */
    '/((?!login|api/auth|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
