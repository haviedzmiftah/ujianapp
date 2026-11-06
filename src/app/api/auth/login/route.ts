import { z } from 'zod'
import { verifyCredentials, buildSessionPayload } from '@/lib/auth/auth.service'
import { createSession } from '@/lib/auth/session'
import { successResponse, errorResponse } from '@/lib/api/response'

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST(request: Request): Promise<Response> {
  const body = await request.json().catch(() => null)

  const parsed = LoginSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse('Email atau password salah', 401)
  }

  const result = await verifyCredentials(parsed.data)

  if (!result.success) {
    if (result.error === 'ACCOUNT_LOCKED') {
      return errorResponse('Akun terkunci', 423, {
        lockedUntil: result.lockedUntil ?? '',
      })
    }
    // Pesan generik — tidak mengungkap detail kegagalan (Req 1.2)
    return errorResponse('Email atau password salah', 401)
  }

  const sessionPayload = await buildSessionPayload(parsed.data.email)
  await createSession(sessionPayload)

  return successResponse({ role: sessionPayload.role })
}
