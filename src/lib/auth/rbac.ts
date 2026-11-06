import type { Role, RbacRouteConfig } from '@/types'

/**
 * Tabel RBAC — mendefinisikan hak akses per role ke path prefix.
 * Semua keputusan akses di proxy.ts mengacu ke sini (Single Source of Truth).
 */
export const RBAC_ROUTES: RbacRouteConfig[] = [
  {
    pathPrefix: '/admin',
    allowedRole: 'ADMIN',
    redirectTo: '/dashboard',
  },
  {
    pathPrefix: '/guru',
    allowedRole: 'GURU',
    redirectTo: '/dashboard',
  },
  {
    pathPrefix: '/siswa',
    allowedRole: 'SISWA',
    redirectTo: '/dashboard',
  },
]

/** URL beranda sesuai role setelah login atau saat akses ditolak. */
export const ROLE_HOME: Record<Role, string> = {
  ADMIN: '/admin/dashboard',
  GURU: '/guru/dashboard',
  SISWA: '/siswa/dashboard',
}

/**
 * Tentukan apakah sebuah path memerlukan autentikasi
 * dan role apa yang diizinkan.
 *
 * @returns config yang cocok, atau null jika path tidak dilindungi
 */
export function getRouteConfig(pathname: string): RbacRouteConfig | null {
  return RBAC_ROUTES.find((route) => pathname.startsWith(route.pathPrefix)) ?? null
}

/**
 * Periksa apakah role diberikan memiliki akses ke config route.
 */
export function hasRouteAccess(role: Role, routeConfig: RbacRouteConfig): boolean {
  return role === routeConfig.allowedRole
}
