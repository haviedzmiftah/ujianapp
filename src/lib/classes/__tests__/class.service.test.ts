import { describe, it, expect, beforeEach } from 'vitest'
import {
  createClass,
  updateClass,
  deleteClass,
  getStudentsInClass,
  ClassConflictError,
  ClassNotFoundError,
  ClassHasStudentsError,
} from '../class.service'
import { classRepository } from '../class.repository'
import type { ClassRecord, UserRecord } from '@/types'

describe('Class Service Unit Tests', () => {
  let mockClasses: ClassRecord[]
  let mockStudents: UserRecord[]

  beforeEach(() => {
    mockClasses = [
      {
        id: 'class-1',
        name: 'X IPA 1',
        grade: '10',
        description: 'Kelas Sepuluh IPA',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _count: { students: 1 },
      },
      {
        id: 'class-empty',
        name: 'XI IPS 2',
        grade: '11',
        description: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _count: { students: 0 },
      },
    ]

    mockStudents = [
      {
        id: 'siswa-1',
        name: 'Ahmad Siswa',
        email: 'ahmad@sekolah.sch.id',
        password: 'hash',
        role: 'SISWA',
        isActive: true,
        failedLoginAttempts: 0,
        lockedUntil: null,
        classId: 'class-1',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]

    classRepository.findAll = async () => mockClasses
    classRepository.findById = async (id: string) => mockClasses.find((c) => c.id === id) ?? null
    classRepository.findByName = async (name: string) =>
      mockClasses.find((c) => c.name.toLowerCase() === name.toLowerCase()) ?? null
    classRepository.create = async (data) => {
      const newClass: ClassRecord = {
        id: `class-${Date.now()}`,
        name: data.name,
        grade: data.grade ?? null,
        description: data.description ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _count: { students: 0 },
      }
      mockClasses.push(newClass)
      return newClass
    }
    classRepository.update = async (id, data) => {
      const idx = mockClasses.findIndex((c) => c.id === id)
      if (idx === -1) return null
      mockClasses[idx] = {
        ...mockClasses[idx],
        ...(data.name ? { name: data.name } : {}),
        ...(data.grade !== undefined ? { grade: data.grade } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        updatedAt: new Date().toISOString(),
      }
      return mockClasses[idx]
    }
    classRepository.delete = async (id: string) => {
      const idx = mockClasses.findIndex((c) => c.id === id)
      if (idx === -1) return false
      mockClasses.splice(idx, 1)
      return true
    }
    classRepository.getStudents = async (classId: string) =>
      mockStudents.filter((s) => s.classId === classId)
  })

  it('should successfully create a new class', async () => {
    const created = await createClass({
      name: 'XII MIPA 3',
      grade: '12',
      description: 'Kelas Baru',
    })

    expect(created.name).toBe('XII MIPA 3')
    expect(created.grade).toBe('12')
  })

  it('should reject creating duplicate class name case-insensitively', async () => {
    await expect(
      createClass({
        name: 'x ipa 1', // duplicate of 'X IPA 1'
      })
    ).rejects.toThrow(ClassConflictError)
  })

  it('should reject deleting a class that still has students', async () => {
    await expect(deleteClass('class-1')).rejects.toThrow(ClassHasStudentsError)
  })

  it('should successfully delete an empty class', async () => {
    await deleteClass('class-empty')
    const remaining = await classRepository.findById('class-empty')
    expect(remaining).toBeNull()
  })

  it('should return students enrolled in a class', async () => {
    const students = await getStudentsInClass('class-1')
    expect(students).toHaveLength(1)
    expect(students[0].name).toBe('Ahmad Siswa')
  })
})
