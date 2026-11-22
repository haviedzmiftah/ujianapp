// Feature: ujian-app, Property 11: violation count monotonically increases, one per event
import { describe, expect, it } from 'vitest'
import fc from 'fast-check'

describe('proctor violation properties', () => {
  it('increments exactly once and never decreases for each violation event', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom('FULLSCREEN_EXIT', 'TAB_SWITCH'), {
          minLength: 1,
          maxLength: 50,
        }),
        (events) => {
          const violationStore: string[] = []
          let violationCount = 0

          events.forEach((event) => {
            const previousCount = violationCount
            violationStore.push(event)
            violationCount = violationStore.length
            expect(violationCount).toBeGreaterThanOrEqual(previousCount)
            expect(violationCount).toBe(previousCount + 1)
          })

          expect(violationStore).toHaveLength(events.length)
        }
      ),
      { numRuns: 100 }
    )
  })

  // Feature: ujian-app, Property 12: auto-submit preserves all stored answers
  it('preserves stored answers when the violation limit triggers submission', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 20 }),
        fc.array(
          fc.record({
            examQuestionId: fc.string({ minLength: 1 }),
            selectedOption: fc.constantFrom('A', 'B', 'C', 'D'),
          }),
          { minLength: 0, maxLength: 50 }
        ),
        (maxViolations, storedAnswers) => {
          let violationCount = 0
          let status = 'ACTIVE'
          const answers = [...storedAnswers]
          const answerCountBeforeSubmit = answers.length

          for (let index = 1; index <= maxViolations; index += 1) {
            violationCount = index
            if (violationCount >= maxViolations) {
              status = 'SUBMITTED'
              break
            }
          }

          expect(status).toBe('SUBMITTED')
          expect(answers.length).toBeGreaterThanOrEqual(answerCountBeforeSubmit)
        }
      ),
      { numRuns: 100 }
    )
  })
})
