import { errorResponse, successResponse } from '@/lib/api/response'
import { isAuthError, requireRole } from '@/lib/auth/guards'
import { listAssignedExams } from '@/lib/exam-sessions/exam-session.service'

export async function GET() {
  const auth = await requireRole('SISWA')
  if (isAuthError(auth)) return auth

  try {
    const exams = await listAssignedExams(auth.userId)
    return successResponse(exams)
  } catch {
    return errorResponse('Gagal mengambil daftar ujian yang ditugaskan.', 500)
  }
}
