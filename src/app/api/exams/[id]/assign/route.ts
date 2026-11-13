import { errorResponse, successResponse } from '@/lib/api/response'
import { isAuthError, requireRole } from '@/lib/auth/guards'
import { assignExam, ExamForbiddenError, ExamNotFoundError, ExamStateError } from '@/lib/exams/exam.service'

interface ExamAssignRouteContext {
  params: Promise<{ id: string }>
}

export async function POST(request: Request, { params }: ExamAssignRouteContext) {
  const auth = await requireRole('GURU')
  if (isAuthError(auth)) return auth

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('Body permintaan tidak valid.', 400)
  }

  const siswaId = typeof body === 'object' && body && 'siswaId' in body ? String((body as { siswaId?: unknown }).siswaId ?? '') : ''
  if (!siswaId.trim()) {
    return errorResponse('siswaId wajib diisi.', 400)
  }

  const { id } = await params

  try {
    return successResponse(await assignExam(auth.userId, id, siswaId), 200)
  } catch (error) {
    return examErrorResponse(error, 'Gagal menugaskan ujian.')
  }
}

function examErrorResponse(error: unknown, fallbackMessage: string): Response {
  if (error instanceof ExamNotFoundError) return errorResponse(error.message, 404)
  if (error instanceof ExamForbiddenError) return errorResponse(error.message, 403)
  if (error instanceof ExamStateError) return errorResponse(error.message, 422)
  return errorResponse(fallbackMessage, 500)
}
