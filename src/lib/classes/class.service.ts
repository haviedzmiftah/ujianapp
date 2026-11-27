import { classRepository } from './class.repository'
import { CreateClassSchema, UpdateClassSchema, AssignStudentClassSchema } from '@/lib/validators/class'
import type { ClassRecord, UserRecord } from '@/types'

export class ClassConflictError extends Error {
  constructor() {
    super('Nama kelas sudah digunakan.')
    this.name = 'ClassConflictError'
  }
}

export class ClassNotFoundError extends Error {
  constructor() {
    super('Kelas tidak ditemukan.')
    this.name = 'ClassNotFoundError'
  }
}

export class ClassHasStudentsError extends Error {
  constructor() {
    super('Kelas tidak dapat dihapus karena masih memiliki siswa terdaftar.')
    this.name = 'ClassHasStudentsError'
  }
}

export class StudentNotFoundError extends Error {
  constructor() {
    super('Siswa tidak ditemukan atau bukan siswa aktif.')
    this.name = 'StudentNotFoundError'
  }
}

export async function listClasses(): Promise<ClassRecord[]> {
  return classRepository.findAll()
}

export async function getClassById(id: string): Promise<ClassRecord> {
  const cls = await classRepository.findById(id)
  if (!cls) throw new ClassNotFoundError()
  return cls
}

export async function createClass(input: unknown): Promise<ClassRecord> {
  const validated = CreateClassSchema.parse(input)

  const existing = await classRepository.findByName(validated.name)
  if (existing) {
    throw new ClassConflictError()
  }

  return classRepository.create({
    name: validated.name,
    grade: validated.grade,
    description: validated.description,
  })
}

export async function updateClass(id: string, input: unknown): Promise<ClassRecord> {
  const validated = UpdateClassSchema.parse(input)
  const existing = await classRepository.findById(id)
  if (!existing) {
    throw new ClassNotFoundError()
  }

  if (validated.name && validated.name.toLowerCase() !== existing.name.toLowerCase()) {
    const duplicate = await classRepository.findByName(validated.name)
    if (duplicate && duplicate.id !== id) {
      throw new ClassConflictError()
    }
  }

  const updated = await classRepository.update(id, validated)
  if (!updated) {
    throw new ClassNotFoundError()
  }
  return updated
}

export async function deleteClass(id: string): Promise<void> {
  const existing = await classRepository.findById(id)
  if (!existing) {
    throw new ClassNotFoundError()
  }

  if ((existing._count?.students ?? 0) > 0) {
    throw new ClassHasStudentsError()
  }

  const success = await classRepository.delete(id)
  if (!success) {
    throw new ClassNotFoundError()
  }
}

export async function getStudentsInClass(classId: string): Promise<UserRecord[]> {
  const existing = await classRepository.findById(classId)
  if (!existing) {
    throw new ClassNotFoundError()
  }
  return classRepository.getStudents(classId)
}

export async function assignStudentToClass(classId: string, input: unknown): Promise<void> {
  const validated = AssignStudentClassSchema.parse(input)
  const existingClass = await classRepository.findById(classId)
  if (!existingClass) {
    throw new ClassNotFoundError()
  }

  const success = await classRepository.assignStudent(classId, validated.siswaId)
  if (!success) {
    throw new StudentNotFoundError()
  }
}

export async function removeStudentFromClass(classId: string, siswaId: string): Promise<void> {
  const existingClass = await classRepository.findById(classId)
  if (!existingClass) {
    throw new ClassNotFoundError()
  }

  const success = await classRepository.removeStudent(classId, siswaId)
  if (!success) {
    throw new StudentNotFoundError()
  }
}
