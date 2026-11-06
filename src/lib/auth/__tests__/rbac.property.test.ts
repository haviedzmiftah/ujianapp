// Feature: ujian-app, Property 10: RBAC access decision consistency
import { describe, it, expect } from 'vitest'
import fc from 'fast-check'
import { getRouteConfig, hasRouteAccess, RBAC_ROUTES, ROLE_HOME } from '../rbac'
import type { Role } from '@/types'

const ALL_ROLES: Role[] = ['ADMIN', 'GURU', 'SISWA']

// Semua path prefix dari tabel RBAC
const PROTECTED_PATHS = RBAC_ROUTES.map((r) => r.pathPrefix)

// Path-path contoh untuk setiap prefix
const SAMPLE_PATHS = RBAC_ROUTES.flatMap((r) => [
  r.pathPrefix,
  `${r.pathPrefix}/dashboard`,
  `${r.pathPrefix}/dashboard/detail/123`,
])

describe('RBAC — Property 10: access decision consistency', () => {
  it('setiap role hanya boleh mengakses path yang sesuai', () => {
    // Feature: ujian-app, Property 10: RBAC access decision consistency
    fc.assert(
      fc.property(
        fc.constantFrom(...ALL_ROLES),
        fc.constantFrom(...SAMPLE_PATHS),
        (role, path) => {
          const routeConfig = getRouteConfig(path)

          // Path harus selalu dikenali sebagai protected
          expect(routeConfig).not.toBeNull()
          if (!routeConfig) return

          const hasAccess = hasRouteAccess(role, routeConfig)
          const expectedAccess = role === routeConfig.allowedRole

          // Keputusan akses HARUS konsisten dengan tabel RBAC
          expect(hasAccess).toBe(expectedAccess)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('path yang tidak dilindungi tidak mengembalikan routeConfig', () => {
    const publicPaths = ['/login', '/api/auth/login', '/', '/public/file.svg']
    for (const path of publicPaths) {
      expect(getRouteConfig(path)).toBeNull()
    }
  })

  it('setiap protected path prefix hanya dapat diakses oleh tepat satu role', () => {
    for (const protectedPath of PROTECTED_PATHS) {
      const routeConfig = getRouteConfig(protectedPath)
      expect(routeConfig).not.toBeNull()

      const allowedRoles = ALL_ROLES.filter(
        (role) => routeConfig && hasRouteAccess(role, routeConfig)
      )

      // Tepat satu role yang boleh akses setiap path prefix
      expect(allowedRoles).toHaveLength(1)
    }
  })

  it('setiap role memiliki halaman beranda yang terdefinisi', () => {
    for (const role of ALL_ROLES) {
      expect(ROLE_HOME[role]).toBeDefined()
      expect(ROLE_HOME[role]).toMatch(/^\//)
    }
  })

  it('redirect target setiap route tidak mengarah ke path yang sama dengan prefix-nya', () => {
    // Feature: ujian-app, Property 10: RBAC access decision consistency
    fc.assert(
      fc.property(fc.constantFrom(...RBAC_ROUTES), (route) => {
        // redirectTo tidak boleh sama dengan pathPrefix (infinite loop)
        expect(route.redirectTo).not.toBe(route.pathPrefix)
      }),
      { numRuns: 100 }
    )
  })
})
