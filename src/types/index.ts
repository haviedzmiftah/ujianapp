// ─── Domain Enums ─────────────────────────────────────────────────────────────

export type Role = 'ADMIN' | 'GURU' | 'SISWA'
export type ExamStatus = 'DRAFT' | 'PUBLISHED'
export type SessionStatus = 'ACTIVE' | 'SUBMITTED' | 'EXPIRED'
export type ViolationType = 'FULLSCREEN_EXIT' | 'TAB_SWITCH'
export type QuestionOption = 'A' | 'B' | 'C' | 'D'
export type TimestampString = string

export interface UserRecord {
  id: string
  name: string
  email: string
  password: string
  role: Role
  isActive: boolean
  failedLoginAttempts: number
  lockedUntil: TimestampString | null
  createdAt: TimestampString
  updatedAt: TimestampString
}

export interface QuestionRecord {
  id: string
  guruId: string
  text: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctOption: QuestionOption
  version: number
  isDeleted: boolean
  createdAt: TimestampString
  updatedAt: TimestampString
}

export interface QuestionSnapshotRecord
  extends Omit<QuestionRecord, 'guruId' | 'isDeleted' | 'createdAt' | 'updatedAt'> {
  questionId: string
  createdAt: TimestampString
}

export interface ExamRecord {
  id: string
  guruId: string
  title: string
  durationMinutes: number
  status: ExamStatus
  fullscreenEnabled: boolean
  tabSwitchDetection: boolean
  maxViolations: number | null
  shuffleQuestions: boolean
  shuffleOptions: boolean
  createdAt: TimestampString
  updatedAt: TimestampString
}

export interface ExamQuestionRecord {
  id: string
  examId: string
  snapshotId: string
  originalQuestionId: string
  orderIndex: number
}

export interface ExamAssignmentRecord {
  id: string
  examId: string
  siswaId: string
  createdAt: TimestampString
}

export interface ExamSessionRecord {
  id: string
  examId: string
  siswaId: string
  status: SessionStatus
  startedAt: TimestampString
  submittedAt: TimestampString | null
  remainingSeconds: number
  finalScore: string | null
}

export interface AnswerRecord {
  id: string
  sessionId: string
  examQuestionId: string
  snapshotId: string
  selectedOption: QuestionOption
  isCorrect: boolean
  answeredAt: TimestampString
}

export interface ViolationRecord {
  id: string
  sessionId: string
  type: ViolationType
  occurredAt: TimestampString
}

export interface SessionOrderRecord {
  id: string
  sessionId: string
  questionOrder: readonly string[]
  optionOrders: Readonly<Record<string, readonly QuestionOption[]>>
}

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
