import type { Role, UserRecord } from '@/types'

async function getDb() {
  const { db } = await import('@/prisma/db')
  return db
}

function sanitizeUserRecord(user: any): UserRecord {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    password: user.password,
    role: user.role as Role,
    isActive: Boolean(user.isActive),
    failedLoginAttempts: Number(user.failedLoginAttempts ?? 0),
    lockedUntil: user.lockedUntil ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }
}

export interface UserRepository {
  findAll(options?: { role?: Role }): Promise<UserRecord[]>
  findById(id: string): Promise<UserRecord | null>
  findByEmail(email: string): Promise<UserRecord | null>
  create(payload: Partial<UserRecord> & { password: string }): Promise<UserRecord>
  update(id: string, payload: Partial<UserRecord>): Promise<UserRecord | null>
  updateStatus(id: string, isActive: boolean): Promise<UserRecord | null>
}

export const userRepository: UserRepository = {
  async findAll(options?: { role?: Role }): Promise<UserRecord[]> {
    const db = await getDb()
    const rows = await (db.orm.public.User as any).orderBy('createdAt', 'desc').all()
    const filtered = options?.role ? rows.filter((row: any) => row.role === options.role) : rows
    return filtered.map((row: any) => sanitizeUserRecord(row))
  },

  async findById(id: string): Promise<UserRecord | null> {
    const db = await getDb()
    const user = await (db.orm.public.User as any).where({ id }).first()
    return user ? sanitizeUserRecord(user) : null
  },

  async findByEmail(email: string): Promise<UserRecord | null> {
    const db = await getDb()
    const user = await (db.orm.public.User as any).where({ email }).first()
    return user ? sanitizeUserRecord(user) : null
  },

  async create(payload: Partial<UserRecord> & { password: string }): Promise<UserRecord> {
    const db = await getDb()
    const created = await (db.orm.public.User as any).create({
      data: {
        name: payload.name,
        email: payload.email,
        password: payload.password,
        role: payload.role,
        isActive: payload.isActive ?? true,
        failedLoginAttempts: payload.failedLoginAttempts ?? 0,
        lockedUntil: payload.lockedUntil ?? null,
      },
    })
    return sanitizeUserRecord(created)
  },

  async update(id: string, payload: Partial<UserRecord>): Promise<UserRecord | null> {
    const db = await getDb()
    const updated = await (db.orm.public.User as any)
      .where({ id })
      .update({
        ...payload,
        updatedAt: new Date().toISOString(),
      })
    return updated ? sanitizeUserRecord(updated) : null
  },

  async updateStatus(id: string, isActive: boolean): Promise<UserRecord | null> {
    const db = await getDb()
    const updated = await (db.orm.public.User as any)
      .where({ id })
      .update({
        isActive,
        updatedAt: new Date().toISOString(),
      })
    return updated ? sanitizeUserRecord(updated) : null
  },
}
