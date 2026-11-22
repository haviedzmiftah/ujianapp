import { errorResponse, successResponse } from '@/lib/api/response'
import { isAuthError, requireRole } from '@/lib/auth/guards'
import {
  ExamSessionAccessError,
  syncExamRemainingTime,
} from '@/lib/exam-sessions/exam-session.service'

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
    !('remainingSeconds' in body) ||
    typeof body.remainingSeconds !== 'number' ||
    !Number.isFinite(body.remainingSeconds)
  ) {
    return errorResponse('Sisa waktu tidak valid.', 400)
  }

  const { id } = await params
  try {
    const result = await syncExamRemainingTime(
      id,
      auth.userId,
      Math.floor(body.remainingSeconds)
    )
    return successResponse(result)
  } catch (error) {
    if (error instanceof ExamSessionAccessError) {
      return errorResponse(error.message, 403)
    }
    return errorResponse(error instanceof Error ? error.message : 'Gagal sinkronisasi timer.', 500)
  }
}
