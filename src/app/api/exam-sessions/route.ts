import { errorResponse, successResponse } from '@/lib/api/response'
import { isAuthError, requireRole } from '@/lib/auth/guards'
import {
  createOrResumeExamSession,
  ExamSessionAccessError,
  ExamSessionConflictError,
} from '@/lib/exam-sessions/exam-session.service'

export async function POST(request: Request) {
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
    !('examId' in body) ||
    typeof body.examId !== 'string' ||
    body.examId.trim() === ''
  ) {
    return errorResponse('examId wajib diisi.', 400)
  }

  try {
    const result = await createOrResumeExamSession(body.examId.trim(), auth.userId)
    return successResponse(result, result.isResumed ? 200 : 201)
  } catch (error) {
    if (error instanceof ExamSessionConflictError) {
      return errorResponse(error.message, 409)
    }
    if (error instanceof ExamSessionAccessError) {
      return errorResponse(error.message, 403)
    }
    return errorResponse(
      error instanceof Error ? error.message : 'Gagal membuat atau melanjutkan sesi ujian.',
      500
    )
  }
}
