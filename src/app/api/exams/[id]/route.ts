import { errorResponse, successResponse } from '@/lib/api/response'
import { isAuthError, requireRole } from '@/lib/auth/guards'
import { ExamForbiddenError, ExamNotFoundError, ExamStateError, updateExam } from '@/lib/exams/exam.service'
import { formatExamIssues, updateExamSchema } from '@/lib/validators/exam'

interface ExamRouteContext {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, { params }: ExamRouteContext) {
  const auth = await requireRole('GURU')
  if (isAuthError(auth)) return auth

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('Body permintaan tidak valid.', 400)
  }

  const parsed = updateExamSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse('Validasi ujian gagal.', 400, formatExamIssues(parsed.error.issues))
  }

  if (Object.keys(parsed.data).length === 0) {
    return errorResponse('Minimal satu field ujian harus diperbarui.', 400)
  }

  const { id } = await params
  try {
    return successResponse(await updateExam(auth.userId, id, parsed.data))
  } catch (error) {
    return examErrorResponse(error, 'Gagal memperbarui ujian.')
  }
}

function examErrorResponse(error: unknown, fallbackMessage: string): Response {
  if (error instanceof ExamNotFoundError) return errorResponse(error.message, 404)
  if (error instanceof ExamForbiddenError) return errorResponse(error.message, 403)
  if (error instanceof ExamStateError) return errorResponse(error.message, 422)
  return errorResponse(fallbackMessage, 500)
}
