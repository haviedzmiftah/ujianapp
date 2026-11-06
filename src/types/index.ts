// ─── Domain Enums ─────────────────────────────────────────────────────────────

export type Role = 'ADMIN' | 'GURU' | 'SISWA'
export type ExamStatus = 'DRAFT' | 'PUBLISHED'
export type SessionStatus = 'ACTIVE' | 'SUBMITTED' | 'EXPIRED'
export type ViolationType = 'FULLSCREEN_EXIT' | 'TAB_SWITCH'

// ─── Session Payload ──────────────────────────────────────────────────────────

/** Payload yang disimpan di JWT cookie. */
export interface SessionPayload {
  userId: string
  email: string
  name: string
  role: Role
  isActive: boolean
  /** Unix timestamp (seconds) */
  expiresAt: number
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginCredentials {
  email: string
  password: string
}

export interface AuthResult {
  success: boolean
  error?: 'INVALID_CREDENTIALS' | 'ACCOUNT_LOCKED' | 'ACCOUNT_INACTIVE'
  lockedUntil?: string
}

// ─── RBAC ─────────────────────────────────────────────────────────────────────

export interface RbacRouteConfig {
  /** Prefix path yang dilindungi */
  pathPrefix: string
  /** Role yang diizinkan mengakses */
  allowedRole: Role
  /** Redirect tujuan jika role tidak sesuai */
  redirectTo: string
}

// ─── API Response ─────────────────────────────────────────────────────────────

export interface ApiSuccessResponse<T> {
  data: T
  message?: string
}

export interface ApiErrorResponse {
  error: string
  details?: Record<string, string>
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse
