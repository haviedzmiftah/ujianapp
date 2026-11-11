import { errorResponse, successResponse } from '@/lib/api/response'
import { isAuthError, requireRole } from '@/lib/auth/guards'
import {
  createQuestion,
  listQuestions,
} from '@/lib/questions/question.service'
import { questionSchema } from '@/lib/validators/question'
import { formatQuestionIssues } from '@/lib/questions/question.validation'

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
    return successResponse(await listQuestions(auth.userId, { page, limit }))
  } catch {
    return errorResponse('Gagal mengambil daftar soal.', 500)
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

  const parsed = questionSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse('Validasi soal gagal.', 400, formatQuestionIssues(parsed.error.issues))
  }

  try {
    return successResponse(await createQuestion(auth.userId, parsed.data), 201)
  } catch {
    return errorResponse('Gagal membuat soal.', 500)
  }
}

function parsePositiveInteger(value: string | null, fallback: number): number | null {
  if (value === null) return fallback
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null
}
