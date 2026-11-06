/**
 * Data Layer — akses database untuk operasi autentikasi user.
 * Hanya berisi query Prisma 8, tidak ada logika bisnis.
 */

// NOTE: contract.json belum di-emit (prisma contract emit belum dijalankan).
// Import db akan menghasilkan error runtime sampai DATABASE_URL dikonfigurasi
// dan `prisma contract emit` dijalankan. Tipe dibuat manual untuk type-safety.

export interface AuthUser {
  id: string
  email: string
  name: string
  password: string
  role: 'ADMIN' | 'GURU' | 'SISWA'
  isActive: boolean
  failedLoginAttempts: number
  lockedUntil: string | null
}

export interface UserRepository {
  findByEmail(email: string): Promise<AuthUser | null>
  incrementFailedAttempts(userId: string): Promise<void>
  setLockedUntil(userId: string, lockedUntil: Date): Promise<void>
  resetFailedAttempts(userId: string): Promise<void>
  checkIsActive(userId: string): Promise<boolean>
}

/**
 * Implementasi UserRepository dengan Prisma 8.
 * Menggunakan dynamic import untuk menghindari error saat contract belum di-emit.
 */
async function getDb() {
  const { db } = await import('@/prisma/db')
  return db
}

export const userRepository: UserRepository = {
  async findByEmail(email: string): Promise<AuthUser | null> {
    const db = await getDb()
    const user = await db.orm.public.User
      .where({ email })
      .first()
    if (!user) return null
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      password: user.password,
      role: user.role as AuthUser['role'],
      isActive: user.isActive,
      failedLoginAttempts: user.failedLoginAttempts,
      lockedUntil: user.lockedUntil ?? null,
    }
  },

  async incrementFailedAttempts(userId: string): Promise<void> {
    const db = await getDb()
    const plan = db.raw.sql`
      UPDATE "public"."User"
      SET "failedLoginAttempts" = "failedLoginAttempts" + 1
      WHERE "id" = ${userId}
    `.affectedCount().build()
    await db.runtime().execute(plan)
  },

  async setLockedUntil(userId: string, lockedUntil: Date): Promise<void> {
    const db = await getDb()
    await db.orm.public.User
      .where({ id: userId })
      .update({
        lockedUntil: lockedUntil.toISOString(),
        failedLoginAttempts: 0,
      })
  },

  async resetFailedAttempts(userId: string): Promise<void> {
    const db = await getDb()
    await db.orm.public.User
      .where({ id: userId })
      .update({ failedLoginAttempts: 0, lockedUntil: null })
  },

  async checkIsActive(userId: string): Promise<boolean> {
    const db = await getDb()
    const user = await db.orm.public.User
      .select('isActive')
      .where({ id: userId })
      .first()
    return user?.isActive ?? false
  },
}
