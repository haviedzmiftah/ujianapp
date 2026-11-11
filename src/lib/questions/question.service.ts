import type { QuestionInput, UpdateQuestionInput } from '@/lib/validators/question'
import type { QuestionRecord } from '@/types'
import { questionRepository } from './question.repository'

export class QuestionNotFoundError extends Error {
  constructor() {
    super('Soal tidak ditemukan.')
    this.name = 'QuestionNotFoundError'
  }
}

export class QuestionForbiddenError extends Error {
  constructor() {
    super('Akses ditolak.')
    this.name = 'QuestionForbiddenError'
  }
}

export class QuestionInUseError extends Error {
  constructor(message = 'Soal tidak dapat diubah atau dihapus karena terkait dengan data ujian.') {
    super(message)
    this.name = 'QuestionInUseError'
  }
}

export interface ListQuestionsInput {
  page?: number
  limit?: number
}

function ensureOwnership(question: QuestionRecord, guruId: string): void {
  if (question.guruId !== guruId) throw new QuestionForbiddenError()
  if (question.isDeleted) throw new QuestionNotFoundError()
}

export async function listQuestions(guruId: string, input: ListQuestionsInput = {}) {
  const page = Math.max(1, Math.floor(input.page ?? 1))
  const limit = Math.min(100, Math.max(1, Math.floor(input.limit ?? 20)))
  const result = await questionRepository.listByOwner(guruId, {
    skip: (page - 1) * limit,
    take: limit,
  })

  return { ...result, page, limit }
}

export async function createQuestion(guruId: string, input: QuestionInput) {
  return questionRepository.create(guruId, input)
}

export async function updateQuestion(
  guruId: string,
  questionId: string,
  input: UpdateQuestionInput
) {
  const existingQuestion = await questionRepository.findById(questionId)
  if (!existingQuestion) throw new QuestionNotFoundError()
  ensureOwnership(existingQuestion, guruId)

  const usage = await questionRepository.findUsage(questionId)
  if (usage.hasActiveSession) {
    throw new QuestionInUseError('Soal tidak dapat diubah selama ujian berlangsung.')
  }

  const updatedInput = { ...existingQuestion, ...input }
  const { id: _id, guruId: _guruId, version: _version, isDeleted: _isDeleted,
    createdAt: _createdAt, updatedAt: _updatedAt, ...content } = updatedInput

  const updatedQuestion = usage.hasReferences
    ? await questionRepository.updateWithSnapshot(
        questionId,
        content,
        existingQuestion.version + 1
      )
    : await questionRepository.update(questionId, input)

  if (!updatedQuestion) throw new QuestionNotFoundError()
  return updatedQuestion
}

export async function deleteQuestion(guruId: string, questionId: string) {
  const existingQuestion = await questionRepository.findById(questionId)
  if (!existingQuestion) throw new QuestionNotFoundError()
  ensureOwnership(existingQuestion, guruId)

  const usage = await questionRepository.findUsage(questionId)
  if (usage.hasReferences) {
    throw new QuestionInUseError('Soal tidak dapat dihapus karena terkait dengan data ujian.')
  }

  const deletedQuestion = await questionRepository.softDelete(questionId)
  if (!deletedQuestion) throw new QuestionNotFoundError()
}
