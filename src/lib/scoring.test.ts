import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import {
  calculateClassAverage,
  calculateQuestionCorrectRate,
  calculateScore,
  buildReport,
  buildScoreDistribution,
} from './scoring'

describe('scoring utilities', () => {
  it('calculateScore is deterministic and stays in valid range', () => {
    // Feature: ujian-app, Property 1: score deterministic and within valid range
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 200 }).chain((totalQuestions) =>
          fc.record({
            totalQuestions: fc.constant(totalQuestions),
            correctCount: fc.integer({ min: 0, max: totalQuestions }),
          })
        ),
        ({ totalQuestions, correctCount }) => {
          const result = calculateScore(correctCount, totalQuestions)
          expect(result).toBe(calculateScore(correctCount, totalQuestions))
          expect(result).toBeGreaterThanOrEqual(0)
          expect(result).toBeLessThanOrEqual(100)
          const hundredths = Math.round(result * 100)
          expect(Math.abs(result * 100 - hundredths)).toBeLessThanOrEqual(1e-9)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('calculateQuestionCorrectRate stays in valid range', () => {
    // Feature: ujian-app, Property 2: question correct rate within valid range
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 200 }),
        fc.integer({ min: 0, max: 200 }),
        (total, correct) => {
          const result = calculateQuestionCorrectRate(Math.min(correct, total), total)
          expect(result).toBeGreaterThanOrEqual(0)
          expect(result).toBeLessThanOrEqual(100)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('calculateClassAverage is arithmetic mean', () => {
    // Feature: ujian-app, Property 3: class average is correct arithmetic mean
    fc.assert(
      fc.property(
        fc.array(fc.float({ min: 0, max: 100, noNaN: true }), { minLength: 1, maxLength: 200 }),
        (scores) => {
          const result = calculateClassAverage(scores)
          const expected = scores.reduce((sum, score) => sum + score, 0) / scores.length
          expect(result).toBeCloseTo(expected, 2)
        }
      ),
      { numRuns: 100 }
    )
  })

  it('buildReport sorts descending by final score', () => {
    // Feature: ujian-app, Property 4: report list sorted descending by score
    fc.assert(
      fc.property(
        fc.array(fc.record({ finalScore: fc.float({ min: 0, max: 100 }) }), { minLength: 1, maxLength: 200 }),
        (sessions) => {
          const report = buildReport(sessions.map((session) => ({ id: 's', siswaId: 'student', finalScore: session.finalScore })))
          for (let index = 0; index < report.length - 1; index += 1) {
            expect(report[index].finalScore).toBeGreaterThanOrEqual(report[index + 1].finalScore)
          }
        }
      ),
      { numRuns: 100 }
    )
  })

  it('buildScoreDistribution assigns scores to buckets correctly', () => {
    // Feature: ujian-app, Property 5: score distribution bucket assignment
    fc.assert(
      fc.property(fc.float({ min: 0, max: 100, noNaN: true }), (score) => {
        const distribution = buildScoreDistribution([score])
        const expectedIndex = score >= 100 ? 9 : Math.floor(score / 10)
        expect(distribution[expectedIndex].count).toBe(1)
      }),
      { numRuns: 100 }
    )
  })
})
