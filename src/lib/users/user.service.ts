import bcrypt from 'bcryptjs'
import { config } from '@/lib/config'
import type { Role, UserRecord } from '@/types'
import { userRepository } from './user.repository'

export class UserConflictError extends Error {
  constructor() {
    super('Email sudah digunakan oleh akun lain.')
    this.name = 'UserConflictError'
  }
}

export class UserNotFoundError extends Error {
  constructor() {
    super('User tidak ditemukan.')
    this.name = 'UserNotFoundError'
  }
}

export interface ListUsersInput {
  page?: number
  limit?: number
  role?: Role
}

export interface CreateUserInput {
  name: string
  email: string
  password: string
  role: Role
}

export interface UpdateUserInput {
  name?: string
  email?: string
  password?: string
  role?: Role
}

function toPublicUser(user: UserRecord) {
  const { password: _password, ...safeUser } = user
  return safeUser
}

async function sendWelcomeEmail(user: { name: string; email: string; role: Role }): Promise<void> {
  if (process.env.NODE_ENV === 'test') return

  // Placeholder: integrasikan dengan notifier email di tahap implementasi berikutnya.
  console.info(`[mock-email] akun baru dibuat untuk ${user.email} (${user.role})`)
}

export async function listUsers(input: ListUsersInput = {}) {
  const page = Math.max(1, Number(input.page ?? 1))
  const limit = Math.min(Math.max(Number(input.limit ?? 20), 1), 100)
  const skip = (page - 1) * limit

  const users = await userRepository.findAll({ role: input.role })
  const pagedUsers = users.slice(skip, skip + limit)

  return {
    items: pagedUsers.map((user) => toPublicUser(user)),
    page,
    limit,
    total: users.length,
  }
}

export async function createUser(input: CreateUserInput) {
  const existingUser = await userRepository.findByEmail(input.email.trim())
  if (existingUser) {
    throw new UserConflictError()
  }

  const passwordHash = await bcrypt.hash(input.password, config.auth.bcryptRounds)
  const created = await userRepository.create({
    name: input.name.trim(),
    email: input.email.trim(),
    password: passwordHash,
    role: input.role,
    isActive: true,
    failedLoginAttempts: 0,
    lockedUntil: null,
  })

  await sendWelcomeEmail({
    name: created.name,
    email: created.email,
    role: created.role,
  })

  return toPublicUser(created)
}

export async function updateUser(id: string, input: UpdateUserInput) {
  const existingUser = await userRepository.findById(id)
  if (!existingUser) {
    throw new UserNotFoundError()
  }

  if (input.email && input.email.trim().toLowerCase() !== existingUser.email.toLowerCase()) {
    const participant = await userRepository.findByEmail(input.email.trim())
    if (participant && participant.id !== id) {
      throw new UserConflictError()
    }
  }

  const nextPayload: Partial<UserRecord> = {
    ...existingUser,
    ...input,
  }

  if (input.password) {
    nextPayload.password = await bcrypt.hash(input.password, config.auth.bcryptRounds)
  }

  const updated = await userRepository.update(id, {
    name: nextPayload.name,
    email: nextPayload.email,
    password: nextPayload.password,
    role: nextPayload.role,
    updatedAt: new Date().toISOString(),
  })

  if (!updated) {
    throw new UserNotFoundError()
  }

  return toPublicUser(updated)
}

export async function setUserStatus(id: string, isActive: boolean) {
  const existingUser = await userRepository.findById(id)
  if (!existingUser) {
    throw new UserNotFoundError()
  }

  const updated = await userRepository.updateStatus(id, isActive)
  if (!updated) {
    throw new UserNotFoundError()
  }

  return toPublicUser(updated)
}
