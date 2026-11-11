import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { QuestionInput } from '@/lib/validators/question'
import type { QuestionRecord } from '@/types'
import { questionRepository } from '../question.repository'
import {
  deleteQuestion,
  QuestionForbiddenError,
  QuestionInUseError,
  updateQuestion,
} from '../question.service'

const questionInput: QuestionInput = {
  text: 'Question',
  optionA: 'Option A',
  optionB: 'Option B',
  optionC: 'Option C',
  optionD: 'Option D',
  correctOption: 'A',
}

function makeQuestion(overrides: Partial<QuestionRecord> = {}): QuestionRecord {
  return {
    id: 'question-1',
    guruId: 'guru-1',
    ...questionInput,
    version: 1,
    isDeleted: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('question service', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('updates unused questions without creating a snapshot', async () => {
    const existing = makeQuestion()
    const updated = makeQuestion({ text: 'Updated question' })
    vi.spyOn(questionRepository, 'findById').mockResolvedValue(existing)
    vi.spyOn(questionRepository, 'findUsage').mockResolvedValue({
      hasReferences: false,
      hasActiveSession: false,
    })
    const update = vi.spyOn(questionRepository, 'update').mockResolvedValue(updated)
    const updateWithSnapshot = vi.spyOn(questionRepository, 'updateWithSnapshot')

    await expect(updateQuestion('guru-1', existing.id, { text: updated.text })).resolves.toEqual(updated)
    expect(update).toHaveBeenCalledWith(existing.id, { text: updated.text })
    expect(updateWithSnapshot).not.toHaveBeenCalled()
  })

  it('increments the version and creates a snapshot when updating a used question', async () => {
    const existing = makeQuestion()
    const updated = makeQuestion({ text: 'New version', version: 2 })
    vi.spyOn(questionRepository, 'findById').mockResolvedValue(existing)
    vi.spyOn(questionRepository, 'findUsage').mockResolvedValue({
      hasReferences: true,
      hasActiveSession: false,
    })
    const updateWithSnapshot = vi
      .spyOn(questionRepository, 'updateWithSnapshot')
      .mockResolvedValue(updated)

    await expect(
      updateQuestion('guru-1', existing.id, { text: updated.text })
    ).resolves.toEqual(updated)
    expect(updateWithSnapshot).toHaveBeenCalledWith(
      existing.id,
      { ...questionInput, text: updated.text },
      2
    )
  })

  it('rejects edits while an exam session is active', async () => {
    const existing = makeQuestion()
    vi.spyOn(questionRepository, 'findById').mockResolvedValue(existing)
    vi.spyOn(questionRepository, 'findUsage').mockResolvedValue({
      hasReferences: true,
      hasActiveSession: true,
    })
    const update = vi.spyOn(questionRepository, 'update')
    const updateWithSnapshot = vi.spyOn(questionRepository, 'updateWithSnapshot')

    await expect(updateQuestion('guru-1', existing.id, { text: 'New version' })).rejects.toThrow(
      QuestionInUseError
    )
    expect(update).not.toHaveBeenCalled()
    expect(updateWithSnapshot).not.toHaveBeenCalled()
  })

  it('rejects changes from a teacher who does not own the question', async () => {
    const existing = makeQuestion()
    vi.spyOn(questionRepository, 'findById').mockResolvedValue(existing)
    const findUsage = vi.spyOn(questionRepository, 'findUsage')

    await expect(updateQuestion('guru-2', existing.id, { text: 'New version' })).rejects.toThrow(
      QuestionForbiddenError
    )
    expect(findUsage).not.toHaveBeenCalled()
  })

  it('rejects deletion when the question is referenced by an exam', async () => {
    const existing = makeQuestion()
    vi.spyOn(questionRepository, 'findById').mockResolvedValue(existing)
    vi.spyOn(questionRepository, 'findUsage').mockResolvedValue({
      hasReferences: true,
      hasActiveSession: false,
    })
    const softDelete = vi.spyOn(questionRepository, 'softDelete')

    await expect(deleteQuestion('guru-1', existing.id)).rejects.toThrow(QuestionInUseError)
    expect(softDelete).not.toHaveBeenCalled()
  })

  it('soft-deletes an unused question', async () => {
    const existing = makeQuestion()
    vi.spyOn(questionRepository, 'findById').mockResolvedValue(existing)
    vi.spyOn(questionRepository, 'findUsage').mockResolvedValue({
      hasReferences: false,
      hasActiveSession: false,
    })
    const softDelete = vi.spyOn(questionRepository, 'softDelete').mockResolvedValue(
      makeQuestion({ isDeleted: true })
    )

    await expect(deleteQuestion('guru-1', existing.id)).resolves.toBeUndefined()
    expect(softDelete).toHaveBeenCalledWith(existing.id)
  })
})
