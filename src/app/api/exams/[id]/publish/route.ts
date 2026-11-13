import { errorResponse, successResponse } from '@/lib/api/response'
import { isAuthError, requireRole } from '@/lib/auth/guards'
import { ExamForbiddenError, ExamNotFoundError, ExamStateError, publishExam } from '@/lib/exams/exam.service'

interface ExamPublishRouteContext {
  params: Promise<{ id: string }>
}

export async function POST(_request: Request, { params }: ExamPublishRouteContext) {
  const auth = await requireRole('GURU')
  if (isAuthError(auth)) return auth

  const { id } = await params

  try {
    return successResponse(await publishExam(auth.userId, id), 200)
  } catch (error) {
    return examErrorResponse(error, 'Gagal mempublikasikan ujian.')
  }
}

function examErrorResponse(error: unknown, fallbackMessage: string): Response {
  if (error instanceof ExamNotFoundError) return errorResponse(error.message, 404)
  if (error instanceof ExamForbiddenError) return errorResponse(error.message, 403)
  if (error instanceof ExamStateError) return errorResponse(error.message, 422)
  return errorResponse(fallbackMessage, 500)
}
