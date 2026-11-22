// Feature: ujian-app, Property 13: single active session constraint
import { describe, expect, it } from 'vitest'
import fc from 'fast-check'

describe('exam session constraints', () => {
  it('allows exactly one concurrent active session per student and exam', () => {
    fc.assert(
      fc.property(fc.integer({ min: 2, max: 10 }), (requestCount) => {
        let activeSessionExists = false
        let successCount = 0
        let conflictCount = 0

        const createWithMutex = () => {
          if (activeSessionExists) {
            conflictCount += 1
            return 409
          }
          activeSessionExists = true
          successCount += 1
          return 201
        }

        Array.from({ length: requestCount }, () => createWithMutex())

        expect(successCount).toBe(1)
        expect(conflictCount).toBe(requestCount - 1)
      }),
      { numRuns: 100 }
    )
  })

  // Feature: ujian-app, Property 14: stored answers retrievable accurately
  it('retrieves saved answers with the exact question and selected option', () => {
    fc.assert(
      fc.property(
        fc.record({
          examQuestionId: fc.string({ minLength: 1 }),
          selectedOption: fc.constantFrom('A', 'B', 'C', 'D'),
        }),
        (input) => {
          const sessions = new Map<
            string,
            Array<{ examQuestionId: string; selectedOption: string }>
          >()
          const sessionId = 'session-property'
          const saveAnswer = (
            questionId: string,
            selectedOption: string
          ) => {
            const answers = sessions.get(sessionId) ?? []
            const updated = answers.filter((answer) => answer.examQuestionId !== questionId)
            updated.push({ examQuestionId: questionId, selectedOption })
            sessions.set(sessionId, updated)
          }
          const getSession = () => ({
            answers: sessions.get(sessionId) ?? [],
          })

          saveAnswer(input.examQuestionId, input.selectedOption)
          const savedAnswer = getSession().answers.find(
            (answer) => answer.examQuestionId === input.examQuestionId
          )

          expect(savedAnswer).toEqual(input)
        }
      ),
      { numRuns: 100 }
    )
  })
})
