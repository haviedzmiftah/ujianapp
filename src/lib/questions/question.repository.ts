import type { QuestionInput, UpdateQuestionInput } from '@/lib/validators/question'
import type { QuestionOption, QuestionRecord } from '@/types'

async function getDb() {
  const { db } = await import('@/prisma/db')
  return db
}

function toQuestionRecord(question: {
  id: string
  guruId: string
  text: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctOption: string
  version: number
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}): QuestionRecord {
  return {
    ...question,
    correctOption: question.correctOption as QuestionOption,
  }
}

export interface QuestionUsage {
  hasReferences: boolean
  hasActiveSession: boolean
}

export interface QuestionRepository {
  listByOwner(
    guruId: string,
    options: { skip: number; take: number }
  ): Promise<{ items: QuestionRecord[]; total: number }>
  findById(id: string): Promise<QuestionRecord | null>
  findUsage(questionId: string): Promise<QuestionUsage>
  create(guruId: string, input: QuestionInput): Promise<QuestionRecord>
  update(id: string, input: UpdateQuestionInput): Promise<QuestionRecord | null>
  updateWithSnapshot(
    id: string,
    input: QuestionInput,
    version: number
  ): Promise<QuestionRecord | null>
  softDelete(id: string): Promise<QuestionRecord | null>
}

export const questionRepository: QuestionRepository = {
  async listByOwner(guruId, { skip, take }) {
    const db = await getDb()
    const questions = await db.orm.public.Question
      .where({ guruId, isDeleted: false })
      .orderBy((question) => question.createdAt.desc())
      .limit(take)
      .offset(skip)
      .all()
    const count = await db.orm.public.Question
      .where({ guruId, isDeleted: false })
      .aggregate((aggregate) => ({ total: aggregate.count() }))

    return { items: questions.map(toQuestionRecord), total: count.total }
  },

  async findById(id) {
    const db = await getDb()
    const question = await db.orm.public.Question.first({ id })
    return question ? toQuestionRecord(question) : null
  },

  async findUsage(questionId) {
    const db = await getDb()
    const examQuestions = await db.orm.public.ExamQuestion
      .where({ originalQuestionId: questionId })
      .select('id')
      .include('exam', (exam) =>
        exam.include('sessions', (session) => session.select('status'))
      )
      .all()

    return {
      hasReferences: examQuestions.length > 0,
      hasActiveSession: examQuestions.some((examQuestion) =>
        examQuestion.exam?.sessions.some((session) => session.status === 'ACTIVE') ?? false
      ),
    }
  },

  async create(guruId, input) {
    const db = await getDb()
    const question = await db.orm.public.Question.create({
      guruId,
      ...input,
    })
    return toQuestionRecord(question)
  },

  async update(id, input) {
    const db = await getDb()
    const question = await db.orm.public.Question
      .where({ id })
      .update({ ...input, updatedAt: new Date().toISOString() })
    return question ? toQuestionRecord(question) : null
  },

  async updateWithSnapshot(id, input, version) {
    const db = await getDb()
    return db.transaction(async (transaction) => {
      const question = await transaction.orm.public.Question
        .where({ id })
        .update({ ...input, version, updatedAt: new Date().toISOString() })
      if (!question) return null

      await transaction.orm.public.QuestionSnapshot.create({
        questionId: id,
        version,
        ...input,
      })
      return toQuestionRecord(question)
    })
  },

  async softDelete(id) {
    const db = await getDb()
    const question = await db.orm.public.Question
      .where({ id })
      .update({ isDeleted: true, updatedAt: new Date().toISOString() })
    return question ? toQuestionRecord(question) : null
  },
}
