import { beforeEach, describe, expect, it, vi } from 'vitest'
import fc from 'fast-check'
import type { QuestionInput } from '@/lib/validators/question'
import type { QuestionRecord } from '@/types'
import { GET, POST } from '../route'
import { DELETE, PATCH } from '../[id]/route'
import { questionRepository } from '@/lib/questions/question.repository'
import { requireRole } from '@/lib/auth/guards'

vi.mock('@/lib/auth/guards', () => ({
  requireRole: vi.fn(),
  isAuthError: (result: unknown) => result instanceof Response,
}))

const questionInput: QuestionInput = {
  text: 'Question',
  optionA: 'Option A',
  optionB: 'Option B',
  optionC: 'Option C',
  optionD: 'Option D',
  correctOption: 'A',
}

const question: QuestionRecord = {
  id: 'question-1',
  guruId: 'guru-1',
  ...questionInput,
  version: 1,
  isDeleted: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

function jsonRequest(url: string, method: string, body: unknown): Request {
  return new Request(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('question API routes', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.mocked(requireRole).mockResolvedValue({
      userId: 'guru-1',
      email: 'guru@example.com',
      name: 'Guru',
      role: 'GURU',
      isActive: true,
      expiresAt: Math.floor(Date.now() / 1000) + 3600,
    })
  })

  it('lists only questions through the authenticated teacher scope', async () => {
    const listByOwner = vi.spyOn(questionRepository, 'listByOwner').mockResolvedValue({
      items: [question],
      total: 1,
    })

    const response = await GET(new Request('http://localhost/api/questions?page=2&limit=5'))

    expect(response.status).toBe(200)
    expect(listByOwner).toHaveBeenCalledWith('guru-1', { skip: 5, take: 5 })
    expect(await response.json()).toMatchObject({ data: { items: [question], page: 2, limit: 5 } })
  })

  it('returns field-specific validation errors when creating a question with blank text', async () => {
    const create = vi.spyOn(questionRepository, 'create')
    const response = await POST(
      jsonRequest('http://localhost/api/questions', 'POST', { ...questionInput, text: ' \t ' })
    )

    expect(response.status).toBe(400)
    expect((await response.json()).details.text).toBeDefined()
    expect(create).not.toHaveBeenCalled()
  })

  it('creates a validated question for the authenticated teacher', async () => {
    const create = vi.spyOn(questionRepository, 'create').mockResolvedValue(question)
    const response = await POST(jsonRequest('http://localhost/api/questions', 'POST', questionInput))

    expect(response.status).toBe(201)
    expect(create).toHaveBeenCalledWith('guru-1', questionInput)
  })

  it('rejects empty updates', async () => {
    const response = await PATCH(
      jsonRequest('http://localhost/api/questions/question-1', 'PATCH', {}),
      { params: Promise.resolve({ id: question.id }) }
    )

    expect(response.status).toBe(400)
  })

  it('rejects deleting a question linked to an exam', async () => {
    vi.spyOn(questionRepository, 'findById').mockResolvedValue(question)
    vi.spyOn(questionRepository, 'findUsage').mockResolvedValue({
      hasReferences: true,
      hasActiveSession: false,
    })

    const response = await DELETE(new Request('http://localhost/api/questions/question-1'), {
      params: Promise.resolve({ id: question.id }),
    })

    expect(response.status).toBe(422)
  })

  it('always rejects deletion of questions linked to at least one exam', async () => {
    // Feature: ujian-app, Property 8: linked question deletion rejected
    let currentQuestion: QuestionRecord = question
    let linkedExamQuestionIds: string[] = []
    vi.spyOn(questionRepository, 'findById').mockImplementation(async (id) =>
      id === currentQuestion.id ? currentQuestion : null
    )
    vi.spyOn(questionRepository, 'findUsage').mockImplementation(async () => ({
      hasReferences: linkedExamQuestionIds.length > 0,
      hasActiveSession: false,
    }))
    const softDelete = vi.spyOn(questionRepository, 'softDelete')

    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.uuid(),
          text: fc.string({ maxLength: 1000 }),
          optionA: fc.string({ maxLength: 500 }),
          optionB: fc.string({ maxLength: 500 }),
          optionC: fc.string({ maxLength: 500 }),
          optionD: fc.string({ maxLength: 500 }),
          correctOption: fc.constantFrom('A', 'B', 'C', 'D'),
          examQuestionIds: fc.array(fc.uuid(), { minLength: 1, maxLength: 5 }),
        }),
        async (generated) => {
          currentQuestion = {
            ...question,
            ...generated,
            guruId: 'guru-1',
            version: 1,
            isDeleted: false,
            createdAt: question.createdAt,
            updatedAt: question.updatedAt,
          }
          linkedExamQuestionIds = generated.examQuestionIds

          const response = await DELETE(
            new Request(`http://localhost/api/questions/${currentQuestion.id}`),
            { params: Promise.resolve({ id: currentQuestion.id }) }
          )

          expect(response.status).toBe(422)
          expect(softDelete).not.toHaveBeenCalled()
        }
      ),
      { numRuns: 100 }
    )
  })
})
