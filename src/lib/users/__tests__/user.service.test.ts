import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST as createUserRoute } from '@/app/api/users/route'
import { createUser, setUserStatus, updateUser, UserConflictError } from '../user.service'
import { userRepository } from '../user.repository'
import * as authGuards from '@/lib/auth/guards'
import type { UserRecord } from '@/types'

vi.mock('@/lib/auth/guards', () => ({
  requireRole: vi.fn(),
  isAuthError: (result: unknown) => result instanceof Response,
}))

const makeUser = (overrides: Partial<UserRecord> = {}): UserRecord => ({
  id: 'user-1',
  name: 'Test User',
  email: 'user@example.com',
  password: 'hashed-password',
  role: 'SISWA',
  isActive: true,
  failedLoginAttempts: 0,
  lockedUntil: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  ...overrides,
})

describe('User API and service behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(authGuards, 'requireRole').mockResolvedValue({
      userId: 'admin-1',
      email: 'admin@example.com',
      name: 'Admin',
      role: 'ADMIN',
      isActive: true,
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
    })
  })

  it('rejects duplicate email during user creation', async () => {
    vi.spyOn(userRepository, 'findByEmail').mockResolvedValue(makeUser())

    await expect(
      createUser({
        name: 'Test User',
        email: 'user@example.com',
        password: 'securepass123',
        role: 'SISWA',
      })
    ).rejects.toThrow(UserConflictError)
  })

  it('returns validation errors for invalid request body', async () => {
    const response = await createUserRoute(
      new Request('http://localhost/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: '',
          email: 'invalid-email',
          password: 'short',
          role: 'INVALID_ROLE',
        }),
      })

    )

    expect(response.status).toBe(400)

    const json = await response.json()
    expect(json.error).toBe('Validation failed')
    expect(json.details).toBeTruthy()
    expect(json.details.email).toBeDefined()
  })

  it('rejects user management requests from non-admin users', async () => {
    vi.spyOn(authGuards, 'requireRole').mockResolvedValue(
      new Response(JSON.stringify({ error: 'Akses ditolak' }), { status: 403 })
    )
    const response = await createUserRoute(new Request('http://localhost/api/users'))

    expect(response.status).toBe(403)
  })

  it('allows disabling an already inactive user', async () => {
    const existing = makeUser({ id: 'user-9', isActive: false })
    vi.spyOn(userRepository, 'findById').mockResolvedValue(existing)
    vi.spyOn(userRepository, 'updateStatus').mockResolvedValue({ ...existing, isActive: false })

    const result = await setUserStatus('user-9', false)

    expect(result.isActive).toBe(false)
    expect(userRepository.updateStatus).toHaveBeenCalledWith('user-9', false)
  })

  it('allows re-enabling a deactivated user', async () => {
    const existing = makeUser({ id: 'user-7', isActive: false })
    vi.spyOn(userRepository, 'findById').mockResolvedValue(existing)
    vi.spyOn(userRepository, 'updateStatus').mockResolvedValue({ ...existing, isActive: true })

    const result = await setUserStatus('user-7', true)

    expect(result.isActive).toBe(true)
    expect(userRepository.updateStatus).toHaveBeenCalledWith('user-7', true)
  })

  it('rejects updating email to another existing account', async () => {
    const currentUser = makeUser({ id: 'user-2', email: 'current@example.com' })
    const otherUser = makeUser({ id: 'user-3', email: 'taken@example.com' })

    vi.spyOn(userRepository, 'findById').mockResolvedValue(currentUser)
    vi.spyOn(userRepository, 'findByEmail').mockResolvedValue(otherUser)

    await expect(
      updateUser('user-2', { email: 'taken@example.com' })
    ).rejects.toThrow(UserConflictError)
  })
})
