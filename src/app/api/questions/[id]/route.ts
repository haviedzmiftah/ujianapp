import { errorResponse, successResponse } from '@/lib/api/response'
import { isAuthError, requireRole } from '@/lib/auth/guards'
import {
  deleteQuestion,
  QuestionForbiddenError,
  QuestionInUseError,
  QuestionNotFoundError,
  updateQuestion,
} from '@/lib/questions/question.service'
import { formatQuestionIssues } from '@/lib/questions/question.validation'
import { updateQuestionSchema } from '@/lib/validators/question'

interface QuestionRouteContext {
  params: Promise<{ id: string }>
}

export async function PATCH(request: Request, { params }: QuestionRouteContext) {
  const auth = await requireRole('GURU')
  if (isAuthError(auth)) return auth

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('Body permintaan tidak valid.', 400)
  }

  const parsed = updateQuestionSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse('Validasi soal gagal.', 400, formatQuestionIssues(parsed.error.issues))
  }
  if (Object.keys(parsed.data).length === 0) {
    return errorResponse('Minimal satu field soal harus diperbarui.', 400)
  }

  const { id } = await params
  try {
    return successResponse(await updateQuestion(auth.userId, id, parsed.data))
  } catch (error) {
    return questionErrorResponse(error, 'Gagal memperbarui soal.')
  }
}

export async function DELETE(_request: Request, { params }: QuestionRouteContext) {
  const auth = await requireRole('GURU')
  if (isAuthError(auth)) return auth

  const { id } = await params
  try {
    await deleteQuestion(auth.userId, id)
    return successResponse({ message: 'Soal berhasil dihapus.' })
  } catch (error) {
    return questionErrorResponse(error, 'Gagal menghapus soal.')
  }
}

function questionErrorResponse(error: unknown, fallbackMessage: string): Response {
  if (error instanceof QuestionNotFoundError) return errorResponse(error.message, 404)
  if (error instanceof QuestionForbiddenError) return errorResponse(error.message, 403)
  if (error instanceof QuestionInUseError) return errorResponse(error.message, 422)
  return errorResponse(fallbackMessage, 500)
}
