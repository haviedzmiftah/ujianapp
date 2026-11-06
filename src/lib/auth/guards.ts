import 'server-only'
import { getSession } from './session'
import { errorResponse } from '@/lib/api/response'
import type { Role, SessionPayload } from '@/types'

/**
 * Guard untuk route handlers — pastikan pengguna sudah login.
 * @returns SessionPayload jika valid, atau Response 401 jika tidak.
 */
export async function requireAuth(): Promise<SessionPayload | Response> {
  const session = await getSession()
  if (!session) {
    return errorResponse('Unauthorized', 401)
  }
  if (!session.isActive) {
    return errorResponse('Akun Anda tidak aktif', 403)
  }
  return session
}

/**
 * Guard untuk route handlers — pastikan pengguna memiliki role tertentu.
 * @returns SessionPayload jika valid, atau Response 403 jika tidak.
 */
export async function requireRole(role: Role): Promise<SessionPayload | Response> {
  const authResult = await requireAuth()
  if (authResult instanceof Response) return authResult

  if (authResult.role !== role) {
    return errorResponse('Akses ditolak', 403)
  }
  return authResult
}

/** Type guard untuk membedakan hasil guard dari Response. */
export function isAuthError(result: SessionPayload | Response): result is Response {
  return result instanceof Response
}
