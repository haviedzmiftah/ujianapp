import { errorResponse, successResponse } from '@/lib/api/response'
import { isAuthError, requireRole } from '@/lib/auth/guards'
import {
  ExamSessionAccessError,
  submitExamSession,
} from '@/lib/exam-sessions/exam-session.service'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function POST(request: Request, { params }: RouteContext) {
  const auth = await requireRole('SISWA')
  if (isAuthError(auth)) return auth

  let localAnswerCount: number | undefined
  try {
    const body = await request.json()
    if (
      typeof body === 'object' &&
      body !== null &&
      'localAnswerCount' in body &&
      typeof body.localAnswerCount === 'number'
    ) {
      localAnswerCount = body.localAnswerCount
    }
  } catch {
    localAnswerCount = undefined
  }

  const { id } = await params
  try {
    const result = await submitExamSession(id, auth.userId, localAnswerCount)
    return successResponse(result)
  } catch (error) {
    if (error instanceof ExamSessionAccessError) {
      return errorResponse(error.message, 403)
    }
    return errorResponse(error instanceof Error ? error.message : 'Gagal mengakhiri ujian.', 500)
  }
}
