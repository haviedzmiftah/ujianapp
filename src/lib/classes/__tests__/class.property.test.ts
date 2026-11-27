import { describe, it, expect, beforeEach } from 'vitest'
import * as fc from 'fast-check'
import {
  createClass,
  deleteClass,
  ClassConflictError,
  ClassHasStudentsError,
} from '../class.service'
import { classRepository } from '../class.repository'
import type { ClassRecord } from '@/types'

// Feature: ujian-app, Property 15: class name uniqueness and student association integrity

describe('Property 15: Class Name Uniqueness and Association Integrity', () => {
  let inMemoryClasses: Map<string, ClassRecord>

  beforeEach(() => {
    inMemoryClasses = new Map()

    classRepository.findAll = async () => Array.from(inMemoryClasses.values())
    classRepository.findById = async (id: string) => inMemoryClasses.get(id) ?? null
    classRepository.findByName = async (name: string) => {
      const lower = name.trim().toLowerCase()
      for (const cls of inMemoryClasses.values()) {
        if (cls.name.trim().toLowerCase() === lower) return cls
      }
      return null
    }
    classRepository.create = async (data) => {
      const id = `class-${Math.random().toString(36).substring(2, 9)}`
      const newCls: ClassRecord = {
        id,
        name: data.name.trim(),
        grade: data.grade ?? null,
        description: data.description ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _count: { students: 0 },
      }
      inMemoryClasses.set(id, newCls)
      return newCls
    }
    classRepository.delete = async (id: string) => inMemoryClasses.delete(id)
  })

  it('rejects duplicate class names regardless of casing or surrounding whitespace', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 40 }).filter((s) => s.trim().length > 0),
        async (rawName) => {
          inMemoryClasses.clear()
          const trimmed = rawName.trim()

          // 1. Buat pertama kali harus berhasil
          const first = await createClass({ name: trimmed })
          expect(first.name).toBe(trimmed)

          // 2. Buat lagi dengan variasi casing / spasi harus melempar ClassConflictError
          const duplicateVariant = `  ${trimmed.toUpperCase()}  `
          await expect(createClass({ name: duplicateVariant })).rejects.toThrow(
            ClassConflictError
          )
        }
      ),
      { numRuns: 100 }
    )
  })

  it('never deletes a class that has enrolled students', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 100 }), // jumlah siswa
        async (studentCount) => {
          const testId = `class-${Math.random().toString(36).substring(2, 9)}`
          inMemoryClasses.set(testId, {
            id: testId,
            name: `Kelas ${testId}`,
            grade: '10',
            description: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            _count: { students: studentCount },
          })

          // Harus menolak penghapusan
          await expect(deleteClass(testId)).rejects.toThrow(ClassHasStudentsError)
          // Kelas harus tetap ada di memory
          expect(inMemoryClasses.has(testId)).toBe(true)
        }
      ),
      { numRuns: 100 }
    )
  })
})
