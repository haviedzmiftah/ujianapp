import { NextRequest } from 'next/server'
import { ZodError } from 'zod'
import { requireRole, isAuthError } from '@/lib/auth/guards'
import { successResponse, errorResponse } from '@/lib/api/response'
import {
  getClassById,
  updateClass,
  deleteClass,
  ClassNotFoundError,
  ClassConflictError,
  ClassHasStudentsError,
} from '@/lib/classes/class.service'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/classes/[id]
 * Mengambil detail kelas berdasarkan ID.
 * Akses: ADMIN
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireRole('ADMIN')
  if (isAuthError(auth)) return auth

  const { id } = await params
  try {
    const cls = await getClassById(id)
    return successResponse(cls)
  } catch (error) {
    if (error instanceof ClassNotFoundError) {
      return errorResponse(error.message, 404)
    }
    return errorResponse(
      error instanceof Error ? error.message : 'Gagal mengambil detail kelas',
      500
    )
  }
}

/**
 * PATCH /api/classes/[id]
 * Memperbarui data kelas.
 * Akses: ADMIN
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = await requireRole('ADMIN')
  if (isAuthError(auth)) return auth

  const { id } = await params
  try {
    const body = await request.json()
    const updated = await updateClass(id, body)
    return successResponse(updated)
  } catch (error) {
    if (error instanceof ZodError) {
      const details: Record<string, string> = {}
      for (const issue of error.issues) {
        details[issue.path.join('.')] = issue.message
      }
      return errorResponse('Data tidak valid', 400, details)
    }
    if (error instanceof ClassNotFoundError) {
      return errorResponse(error.message, 404)
    }
    if (error instanceof ClassConflictError) {
      return errorResponse(error.message, 409)
    }
    return errorResponse(
      error instanceof Error ? error.message : 'Gagal memperbarui kelas',
      500
    )
  }
}

/**
 * DELETE /api/classes/[id]
 * Menghapus kelas jika tidak memiliki siswa terdaftar.
 * Akses: ADMIN
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireRole('ADMIN')
  if (isAuthError(auth)) return auth

  const { id } = await params
  try {
    await deleteClass(id)
    return successResponse({ message: 'Kelas berhasil dihapus' })
  } catch (error) {
    if (error instanceof ClassNotFoundError) {
      return errorResponse(error.message, 404)
    }
    if (error instanceof ClassHasStudentsError) {
      return errorResponse(error.message, 422)
    }
    return errorResponse(
      error instanceof Error ? error.message : 'Gagal menghapus kelas',
      500
    )
  }
}
