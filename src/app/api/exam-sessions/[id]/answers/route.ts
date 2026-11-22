import { errorResponse, successResponse } from '@/lib/api/response'
import { isAuthError, requireRole } from '@/lib/auth/guards'
import {
  ExamSessionAccessError,
  saveExamAnswer,
} from '@/lib/exam-sessions/exam-session.service'
import type { QuestionOption } from '@/types'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, { params }: RouteContext) {
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
    !('examQuestionId' in body) ||
    typeof body.examQuestionId !== 'string' ||
    !('selectedOption' in body) ||
    !['A', 'B', 'C', 'D'].includes(String(body.selectedOption))
  ) {
    return errorResponse('Jawaban tidak valid.', 400)
  }

  const { id } = await params
  try {
    const answer = await saveExamAnswer(
      id,
      auth.userId,
      body.examQuestionId,
      body.selectedOption as QuestionOption
    )
    return successResponse(answer)
  } catch (error) {
    if (error instanceof ExamSessionAccessError) {
      return errorResponse(error.message, 403)
    }
    return errorResponse(error instanceof Error ? error.message : 'Gagal menyimpan jawaban.', 500)
  }
}
