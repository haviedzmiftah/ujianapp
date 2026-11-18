import { requireRole, isAuthError } from '@/lib/auth/guards'
import { errorResponse, successResponse } from '@/lib/api/response'
import {
  buildExamReport,
  ReportForbiddenError,
  ReportNotFoundError,
} from '@/lib/reports/report.service'

export async function GET(
  _request: Request,
  context: { params: Promise<{ examId: string }> }
) {
  const auth = await requireRole('GURU')
  if (isAuthError(auth)) return auth

  const { examId } = await context.params
  try {
    return successResponse(await buildExamReport(auth.userId, examId))
  } catch (error) {
    if (error instanceof ReportNotFoundError) {
      return errorResponse(error.message, 404)
    }
    if (error instanceof ReportForbiddenError) {
      return errorResponse(error.message, 403)
    }
    return errorResponse('Gagal mengambil laporan ujian.', 500)
  }
}
