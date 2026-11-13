import { errorResponse, successResponse } from '@/lib/api/response'
import { isAuthError, requireRole } from '@/lib/auth/guards'
import { createExam, listExams } from '@/lib/exams/exam.service'
import { createExamSchema, formatExamIssues } from '@/lib/validators/exam'

export async function GET(request: Request) {
  const auth = await requireRole('GURU')
  if (isAuthError(auth)) return auth

  try {
    const searchParams = new URL(request.url).searchParams
    const page = parsePositiveInteger(searchParams.get('page'), 1)
    const limit = parsePositiveInteger(searchParams.get('limit'), 20)

    if (page === null || limit === null) {
      return errorResponse('Parameter page dan limit harus berupa bilangan bulat positif.', 400)
    }

    return successResponse(await listExams(auth.userId, { page, limit }))
  } catch {
    return errorResponse('Gagal mengambil daftar ujian.', 500)
  }
}

export async function POST(request: Request) {
  const auth = await requireRole('GURU')
  if (isAuthError(auth)) return auth

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return errorResponse('Body permintaan tidak valid.', 400)
  }

  const parsed = createExamSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse('Validasi ujian gagal.', 400, formatExamIssues(parsed.error.issues))
  }

  try {
    return successResponse(await createExam(auth.userId, parsed.data), 201)
  } catch (error) {
    return examErrorResponse(error, 'Gagal membuat ujian.')
  }
}

function parsePositiveInteger(value: string | null, fallback: number): number | null {
  if (value === null) return fallback
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}

function examErrorResponse(error: unknown, fallbackMessage: string): Response {
  return errorResponse(error instanceof Error ? error.message : fallbackMessage, 500)
}
