import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import { fisherYatesShuffle, generateSessionOrder } from './shuffle'

describe('shuffle utilities', () => {
  it('fisherYatesShuffle preserves elements and does not mutate the input', () => {
    fc.assert(
      fc.property(fc.array(fc.string(), { minLength: 0, maxLength: 50 }), (items) => {
        const original = [...items]
        const shuffled = fisherYatesShuffle(items)

        expect(items).toEqual(original)
        expect([...shuffled].sort()).toEqual([...items].sort())
      }),
      { numRuns: 100 }
    )
  })

  it('generated order respects the shuffle flags and includes every option', () => {
    fc.assert(
      fc.property(
        fc.array(fc.record({ id: fc.string({ minLength: 1 }) }), {
          minLength: 1,
          maxLength: 30,
        }),
        fc.boolean(),
        fc.boolean(),
        (questions, shuffleQuestions, shuffleOptions) => {
          const order = generateSessionOrder(questions, shuffleQuestions, shuffleOptions)

          expect([...order.questionOrder].sort()).toEqual(
            [...new Set(questions.map((question) => question.id))].sort()
          )
          for (const question of questions) {
            expect([...order.optionOrders[question.id]].sort()).toEqual(['A', 'B', 'C', 'D'])
          }
        }
      ),
      { numRuns: 100 }
    )
  })
})
