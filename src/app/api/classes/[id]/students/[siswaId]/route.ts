import { NextRequest } from 'next/server'
import { requireRole, isAuthError } from '@/lib/auth/guards'
import { successResponse, errorResponse } from '@/lib/api/response'
import {
  removeStudentFromClass,
  ClassNotFoundError,
  StudentNotFoundError,
} from '@/lib/classes/class.service'

interface RouteParams {
  params: Promise<{ id: string; siswaId: string }>
}

/**
 * DELETE /api/classes/[id]/students/[siswaId]
 * Mengeluarkan siswa dari kelas.
 * Akses: ADMIN
 */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireRole('ADMIN')
  if (isAuthError(auth)) return auth

  const { id, siswaId } = await params
  try {
    await removeStudentFromClass(id, siswaId)
    return successResponse({ message: 'Siswa berhasil dikeluarkan dari kelas' })
  } catch (error) {
    if (error instanceof ClassNotFoundError) {
      return errorResponse(error.message, 404)
    }
    if (error instanceof StudentNotFoundError) {
      return errorResponse(error.message, 404)
    }
    return errorResponse(
      error instanceof Error ? error.message : 'Gagal mengeluarkan siswa dari kelas',
      500
    )
  }
}
