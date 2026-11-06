'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { verifyCredentials, buildSessionPayload } from '@/lib/auth/auth.service'
import { createSession } from '@/lib/auth/session'
import { ROLE_HOME } from '@/lib/auth/rbac'

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export interface LoginActionState {
  error?: 'INVALID_CREDENTIALS' | 'ACCOUNT_LOCKED' | 'ACCOUNT_INACTIVE' | 'VALIDATION_ERROR'
  lockedUntil?: string
}

/**
 * Server Action untuk login — dipanggil dari form halaman login.
 * Req 1.1, 1.2, 1.3
 */
export async function loginAction(
  _prevState: LoginActionState | undefined,
  formData: FormData
): Promise<LoginActionState | undefined> {
  const parsed = LoginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  })

  if (!parsed.success) {
    return { error: 'VALIDATION_ERROR' }
  }

  const result = await verifyCredentials(parsed.data)

  if (!result.success) {
    return {
      error: result.error,
      lockedUntil: result.lockedUntil,
    }
  }

  const sessionPayload = await buildSessionPayload(parsed.data.email)
  await createSession(sessionPayload)

  // Redirect ke beranda sesuai role — tidak ada return setelah redirect
  redirect(ROLE_HOME[sessionPayload.role])
}

/**
 * Server Action untuk logout.
 * Req 1.4
 */
export async function logoutAction(): Promise<void> {
  const { deleteSession } = await import('@/lib/auth/session')
  await deleteSession()
  redirect('/login')
}
