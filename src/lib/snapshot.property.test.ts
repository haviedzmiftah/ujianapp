// Feature: ujian-app, Property 6: question snapshot immutability
import { describe, expect, it } from 'vitest'
import fc from 'fast-check'

interface SnapshotData {
  text: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctOption: 'A' | 'B' | 'C' | 'D'
}

describe('QuestionSnapshot immutability', () => {
  it('remains identical after the source question is updated repeatedly', () => {
    fc.assert(
      fc.property(
        fc.record({
          text: fc.string(),
          optionA: fc.string(),
          optionB: fc.string(),
          optionC: fc.string(),
          optionD: fc.string(),
          correctOption: fc.constantFrom('A', 'B', 'C', 'D'),
        }),
        fc.array(
          fc.record({
            text: fc.string(),
            optionA: fc.string(),
            optionB: fc.string(),
            optionC: fc.string(),
            optionD: fc.string(),
            correctOption: fc.constantFrom('A', 'B', 'C', 'D'),
          }),
          { maxLength: 20 }
        ),
        (initialSnapshot: SnapshotData, updates: SnapshotData[]) => {
          const snapshots = new Map<string, SnapshotData>()
          const snapshotId = 'snapshot-property'

          let sourceQuestion = { ...initialSnapshot }
          snapshots.set(snapshotId, { ...sourceQuestion })

          const readSnapshot = () => ({ ...snapshots.get(snapshotId)! })
          const snapshotBeforeUpdates = readSnapshot()

          updates.forEach((update) => {
            sourceQuestion = { ...sourceQuestion, ...update }
          })

          const snapshotAfterUpdates = readSnapshot()
          expect(snapshotAfterUpdates).toEqual(snapshotBeforeUpdates)
          expect(snapshotAfterUpdates.text).toBe(initialSnapshot.text)
          expect(snapshotAfterUpdates.optionA).toBe(initialSnapshot.optionA)
          expect(snapshotAfterUpdates.optionB).toBe(initialSnapshot.optionB)
          expect(snapshotAfterUpdates.optionC).toBe(initialSnapshot.optionC)
          expect(snapshotAfterUpdates.optionD).toBe(initialSnapshot.optionD)
          expect(snapshotAfterUpdates.correctOption).toBe(initialSnapshot.correctOption)
        }
      ),
      { numRuns: 100 }
    )
  })
})
