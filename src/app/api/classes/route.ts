import { NextRequest } from 'next/server'
import { ZodError } from 'zod'
import { requireAuth, requireRole, isAuthError } from '@/lib/auth/guards'
import { successResponse, errorResponse } from '@/lib/api/response'
import { listClasses, createClass, ClassConflictError } from '@/lib/classes/class.service'

/**
 * GET /api/classes
 * Mengambil daftar seluruh kelas beserta jumlah siswa.
 * Akses: ADMIN, GURU
 */
export async function GET() {
  const auth = await requireAuth()
  if (isAuthError(auth)) return auth

  if (auth.role !== 'ADMIN' && auth.role !== 'GURU') {
    return errorResponse('Akses ditolak', 403)
  }

  try {
    const classes = await listClasses()
    return successResponse(classes)
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : 'Terjadi kesalahan internal',
      500
    )
  }
}

/**
 * POST /api/classes
 * Membuat kelas baru.
 * Akses: ADMIN
 */
export async function POST(request: NextRequest) {
  const auth = await requireRole('ADMIN')
  if (isAuthError(auth)) return auth

  try {
    const body = await request.json()
    const newClass = await createClass(body)
    return successResponse(newClass, 201)
  } catch (error) {
    if (error instanceof ZodError) {
      const details: Record<string, string> = {}
      for (const issue of error.issues) {
        details[issue.path.join('.')] = issue.message
      }
      return errorResponse('Data tidak valid', 400, details)
    }

    if (error instanceof ClassConflictError) {
      return errorResponse(error.message, 409)
    }

    return errorResponse(
      error instanceof Error ? error.message : 'Gagal membuat kelas baru',
      500
    )
  }
}
