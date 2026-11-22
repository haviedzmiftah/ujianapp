import { errorResponse, successResponse } from '@/lib/api/response'
import { isAuthError, requireRole } from '@/lib/auth/guards'
import {
  ExamSessionAccessError,
  recordExamViolation,
} from '@/lib/exam-sessions/exam-session.service'
import type { ViolationType } from '@/types'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(request: Request, { params }: RouteContext) {
  const auth = await requireRole('SISWA')
  if (isAuthError(auth)) return auth

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('Body permintaan tidak valid.', 400)
  }
  if (
    typeof body !== 'object' ||
    body === null ||
    !('type' in body) ||
    !['FULLSCREEN_EXIT', 'TAB_SWITCH'].includes(String(body.type))
  ) {
    return errorResponse('Jenis pelanggaran tidak valid.', 400)
  }

  const { id } = await params
  try {
    const result = await recordExamViolation(id, auth.userId, body.type as ViolationType)
    return successResponse(result)
  } catch (error) {
    if (error instanceof ExamSessionAccessError) {
      return errorResponse(error.message, 403)
    }
    return errorResponse(error instanceof Error ? error.message : 'Gagal mencatat pelanggaran.', 500)
  }
}
