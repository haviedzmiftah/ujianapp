import type { ClassRecord, UserRecord } from '@/types'

async function getDb() {
  const { db } = await import('@/prisma/db')
  return db
}

function sanitizeClass(cls: any, studentCount?: number): ClassRecord {
  return {
    id: cls.id,
    name: cls.name,
    grade: cls.grade ?? null,
    description: cls.description ?? null,
    createdAt: cls.createdAt,
    updatedAt: cls.updatedAt,
    _count: {
      students: studentCount ?? (cls.students?.length ?? 0),
    },
  }
}

export interface ClassRepository {
  findAll(): Promise<ClassRecord[]>
  findById(id: string): Promise<ClassRecord | null>
  findByName(name: string): Promise<ClassRecord | null>
  create(data: { name: string; grade?: string | null; description?: string | null }): Promise<ClassRecord>
  update(id: string, data: { name?: string; grade?: string | null; description?: string | null }): Promise<ClassRecord | null>
  delete(id: string): Promise<boolean>
  getStudents(classId: string): Promise<UserRecord[]>
  assignStudent(classId: string, siswaId: string): Promise<boolean>
  removeStudent(classId: string, siswaId: string): Promise<boolean>
}

export const classRepository: ClassRepository = {
  async findAll(): Promise<ClassRecord[]> {
    const db = await getDb()
    const classes = await (db.orm.public.Class as any).orderBy((c: any) => c.name.asc()).all()
    const users = await (db.orm.public.User as any).where({ role: 'SISWA' }).all()

    return classes.map((cls: any) => {
      const studentCount = users.filter((u: any) => u.classId === cls.id).length
      return sanitizeClass(cls, studentCount)
    })
  },

  async findById(id: string): Promise<ClassRecord | null> {
    const db = await getDb()
    const cls = await (db.orm.public.Class as any).where({ id }).first()
    if (!cls) return null

    const students = await (db.orm.public.User as any).where({ classId: id, role: 'SISWA' }).all()
    return sanitizeClass(cls, students.length)
  },

  async findByName(name: string): Promise<ClassRecord | null> {
    const db = await getDb()
    const all = await (db.orm.public.Class as any).all()
    const target = all.find((c: any) => c.name.trim().toLowerCase() === name.trim().toLowerCase())
    if (!target) return null

    const students = await (db.orm.public.User as any).where({ classId: target.id, role: 'SISWA' }).all()
    return sanitizeClass(target, students.length)
  },

  async create(data): Promise<ClassRecord> {
    const db = await getDb()
    const created = await (db.orm.public.Class as any).create({
      name: data.name.trim(),
      grade: data.grade?.trim() || null,
      description: data.description?.trim() || null,
    })
    return sanitizeClass(created, 0)
  },

  async update(id, data): Promise<ClassRecord | null> {
    const db = await getDb()
    const updated = await (db.orm.public.Class as any).where({ id }).update({
      ...(data.name ? { name: data.name.trim() } : {}),
      ...(data.grade !== undefined ? { grade: data.grade ? data.grade.trim() : null } : {}),
      ...(data.description !== undefined ? { description: data.description ? data.description.trim() : null } : {}),
      updatedAt: new Date().toISOString(),
    })
    if (!updated) return null

    const students = await (db.orm.public.User as any).where({ classId: id, role: 'SISWA' }).all()
    return sanitizeClass(updated, students.length)
  },

  async delete(id: string): Promise<boolean> {
    const db = await getDb()
    const deleted = await (db.orm.public.Class as any).where({ id }).delete()
    return Boolean(deleted)
  },

  async getStudents(classId: string): Promise<UserRecord[]> {
    const db = await getDb()
    const students = await (db.orm.public.User as any)
      .where({ classId, role: 'SISWA' })
      .orderBy((u: any) => u.name.asc())
      .all()

    return students.map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      password: u.password,
      role: u.role,
      isActive: Boolean(u.isActive),
      failedLoginAttempts: Number(u.failedLoginAttempts ?? 0),
      lockedUntil: u.lockedUntil ?? null,
      classId: u.classId ?? null,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }))
  },

  async assignStudent(classId: string, siswaId: string): Promise<boolean> {
    const db = await getDb()
    const updated = await (db.orm.public.User as any)
      .where({ id: siswaId, role: 'SISWA' })
      .update({
        classId,
        updatedAt: new Date().toISOString(),
      })
    return Boolean(updated)
  },

  async removeStudent(classId: string, siswaId: string): Promise<boolean> {
    const db = await getDb()
    const updated = await (db.orm.public.User as any)
      .where({ id: siswaId, classId, role: 'SISWA' })
      .update({
        classId: null,
        updatedAt: new Date().toISOString(),
      })
    return Boolean(updated)
  },
}
