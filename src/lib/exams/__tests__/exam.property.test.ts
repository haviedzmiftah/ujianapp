// Feature: ujian-app, Property 9: exam status transition guards
import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { canAssignExam, canPublishExam } from '../exam.service'

describe('exam status transitions', () => {
  it('publish and assign are allowed only for the correct statuses', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('DRAFT', 'PUBLISHED'),
        (status) => {
          expect(canPublishExam(status)).toBe(status === 'DRAFT')
          expect(canAssignExam(status)).toBe(status === 'PUBLISHED')
        }
      ),
      { numRuns: 100 }
    )
  })
})
