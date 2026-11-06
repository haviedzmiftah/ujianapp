import 'server-only'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { config, getJwtSecret } from '@/lib/config'
import type { SessionPayload } from '@/types'

// ─── Encrypt / Decrypt ────────────────────────────────────────────────────────

export async function encryptSession(payload: SessionPayload): Promise<string> {
  const secret = getJwtSecret()
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(payload.expiresAt)
    .sign(secret)
}

export async function decryptSession(token: string): Promise<SessionPayload | null> {
  try {
    const secret = getJwtSecret()
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] })
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

// ─── Cookie Management ────────────────────────────────────────────────────────

export async function createSession(payload: Omit<SessionPayload, 'expiresAt'>): Promise<void> {
  const expiresAt = Math.floor(Date.now() / 1000) + config.session.durationSeconds
  const sessionPayload: SessionPayload = { ...payload, expiresAt }
  const token = await encryptSession(sessionPayload)
  const cookieStore = await cookies()

  cookieStore.set(config.session.cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(expiresAt * 1000),
    sameSite: 'lax',
    path: '/',
  })
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(config.session.cookieName)?.value
  if (!token) return null
  return decryptSession(token)
}

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(config.session.cookieName)
}

export function isSessionExpiringSoon(session: SessionPayload): boolean {
  const remainingSeconds = session.expiresAt - Math.floor(Date.now() / 1000)
  return remainingSeconds <= config.session.refreshThresholdSeconds
}

export async function refreshSession(session: SessionPayload): Promise<void> {
  await createSession({
    userId: session.userId,
    email: session.email,
    name: session.name,
    role: session.role,
    isActive: session.isActive,
  })
}
