import 'server-only'
import bcrypt from 'bcryptjs'
import { config } from '@/lib/config'
import { userRepository } from './user.repository'
import type { AuthResult, LoginCredentials } from '@/types'

// ─── Lockout helpers ──────────────────────────────────────────────────────────

function isAccountLocked(lockedUntil: string | null): boolean {
  if (!lockedUntil) return false
  return new Date(lockedUntil) > new Date()
}

function calculateLockoutExpiry(): Date {
  return new Date(Date.now() + config.auth.lockoutMinutes * 60 * 1000)
}

// ─── Login ────────────────────────────────────────────────────────────────────

/**
 * Verifikasi kredensial pengguna dan kelola logika lockout.
 *
 * Requirements: 1.1, 1.2, 1.3
 */
export async function verifyCredentials(credentials: LoginCredentials): Promise<AuthResult> {
  const user = await userRepository.findByEmail(credentials.email)

  // User tidak ditemukan — kembalikan pesan generik (Req 1.2)
  if (!user) {
    return { success: false, error: 'INVALID_CREDENTIALS' }
  }

  // Akun tidak aktif
  if (!user.isActive) {
    return { success: false, error: 'ACCOUNT_INACTIVE' }
  }

  // Akun terkunci (Req 1.3)
  if (isAccountLocked(user.lockedUntil)) {
    return { success: false, error: 'ACCOUNT_LOCKED', lockedUntil: user.lockedUntil! }
  }

  // Verifikasi password
  const isPasswordValid = await bcrypt.compare(credentials.password, user.password)

  if (!isPasswordValid) {
    await handleFailedAttempt(user.id, user.failedLoginAttempts)
    return { success: false, error: 'INVALID_CREDENTIALS' }
  }

  // Login berhasil — reset counter (Req 1.1)
  await userRepository.resetFailedAttempts(user.id)

  return { success: true }
}

/**
 * Tangani percobaan login gagal dan terapkan lockout jika perlu.
 */
async function handleFailedAttempt(userId: string, currentFailedAttempts: number): Promise<void> {
  const newFailedCount = currentFailedAttempts + 1

  if (newFailedCount >= config.auth.maxFailedAttempts) {
    await userRepository.setLockedUntil(userId, calculateLockoutExpiry())
  } else {
    await userRepository.incrementFailedAttempts(userId)
  }
}

// ─── Session Payload Builder ──────────────────────────────────────────────────

export async function buildSessionPayload(email: string) {
  const user = await userRepository.findByEmail(email)
  if (!user) throw new Error('User not found after successful auth')

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isActive: user.isActive,
  }
}
