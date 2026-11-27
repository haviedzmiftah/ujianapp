import { NextRequest } from 'next/server'
import { ZodError } from 'zod'
import { requireAuth, requireRole, isAuthError } from '@/lib/auth/guards'
import { successResponse, errorResponse } from '@/lib/api/response'
import {
  getStudentsInClass,
  assignStudentToClass,
  ClassNotFoundError,
  StudentNotFoundError,
} from '@/lib/classes/class.service'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/classes/[id]/students
 * Mengambil daftar siswa yang terdaftar di kelas ini.
 * Akses: ADMIN, GURU
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const auth = await requireAuth()
  if (isAuthError(auth)) return auth

  if (auth.role !== 'ADMIN' && auth.role !== 'GURU') {
    return errorResponse('Akses ditolak', 403)
  }

  const { id } = await params
  try {
    const students = await getStudentsInClass(id)
    return successResponse(students)
  } catch (error) {
    if (error instanceof ClassNotFoundError) {
      return errorResponse(error.message, 404)
    }
    return errorResponse(
      error instanceof Error ? error.message : 'Gagal mengambil data siswa kelas',
      500
    )
  }
}

/**
 * POST /api/classes/[id]/students
 * Memasukkan atau memindahkan siswa ke dalam kelas ini.
 * Body: { siswaId: string }
 * Akses: ADMIN
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const auth = await requireRole('ADMIN')
  if (isAuthError(auth)) return auth

  const { id } = await params
  try {
    const body = await request.json()
    await assignStudentToClass(id, body)
    return successResponse({ message: 'Siswa berhasil dimasukkan ke dalam kelas' })
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
    if (error instanceof StudentNotFoundError) {
      return errorResponse(error.message, 404)
    }
    return errorResponse(
      error instanceof Error ? error.message : 'Gagal menambahkan siswa ke kelas',
      500
    )
  }
}
