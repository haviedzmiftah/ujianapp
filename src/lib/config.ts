/**
 * Konfigurasi terpusat aplikasi.
 * Semua nilai konfigurasi dan env vars harus diakses dari sini.
 */
export const config = {
  session: {
    durationSeconds: 60 * 60, // 60 menit
    refreshThresholdSeconds: 5 * 60, // 5 menit tersisa → auto-refresh
    cookieName: 'session',
  },
  auth: {
    maxFailedAttempts: 5,
    lockoutMinutes: 15,
    bcryptRounds: 12,
  },
  exam: {
    timerSyncIntervalSeconds: 30,
    answerRetrySyncSeconds: 5,
    answerMaxRetries: 3,
  },
} as const

export function getJwtSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET
  if (!secret) throw new Error('SESSION_SECRET environment variable is not set')
  return new TextEncoder().encode(secret)
}
