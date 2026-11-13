import type { ExamRecord, ExamAssignmentRecord } from '@/types'

async function getDb() {
  const { db } = await import('@/prisma/db')
  return db
}

function toExamRecord(exam: {
  id: string
  guruId: string
  title: string
  durationMinutes: number
  status: 'DRAFT' | 'PUBLISHED'
  fullscreenEnabled: boolean
  tabSwitchDetection: boolean
  maxViolations: number | null
  shuffleQuestions: boolean
  shuffleOptions: boolean
  createdAt: string
  updatedAt: string
}): ExamRecord {
  return {
    ...exam,
    maxViolations: exam.maxViolations ?? null,
  }
}

export interface ExamRepository {
  listByOwner(guruId: string, options: { skip: number; take: number }): Promise<{ items: ExamRecord[]; total: number }>
  findById(id: string): Promise<ExamRecord | null>
  create(
    guruId: string,
    input: {
      title: string
      durationMinutes: number
      maxViolations?: number | null
      shuffleQuestions: boolean
      shuffleOptions: boolean
      fullscreenEnabled: boolean
      tabSwitchDetection: boolean
      questionIds: string[]
    }
  ): Promise<ExamRecord>
  update(id: string, input: Partial<ExamRecord>): Promise<ExamRecord | null>
  updateStatus(id: string, status: 'DRAFT' | 'PUBLISHED'): Promise<ExamRecord | null>
  upsertAssignment(examId: string, siswaId: string): Promise<ExamAssignmentRecord>
}

export const examRepository: ExamRepository = {
  async listByOwner(guruId, { skip, take }) {
    const db = await getDb()
    const exams = await db.orm.public.Exam.where({ guruId })
      .orderBy((exam) => exam.createdAt.desc())
      .limit(take)
      .offset(skip)
      .all()

    const count = await db.orm.public.Exam.where({ guruId }).aggregate((aggregate) => ({
      total: aggregate.count(),
    }))

    return {
      items: exams.map(toExamRecord),
      total: count.total,
    }
  },

  async findById(id) {
    const db = await getDb()
    const exam = await db.orm.public.Exam.first({ id })
    return exam ? toExamRecord(exam) : null
  },

  async create(guruId, input) {
    const db = await getDb()
    const uniqueQuestionIds = [...new Set(input.questionIds)]

    if (uniqueQuestionIds.length === 0) {
      throw new Error('Setidaknya satu soal harus dipilih untuk ujian.')
    }

    return db.transaction(async (transaction) => {
      const exam = await transaction.orm.public.Exam.create({
        guruId,
        title: input.title,
        durationMinutes: input.durationMinutes,
        status: 'DRAFT',
        maxViolations: input.maxViolations ?? null,
        fullscreenEnabled: input.fullscreenEnabled,
        tabSwitchDetection: input.tabSwitchDetection,
        shuffleQuestions: input.shuffleQuestions,
        shuffleOptions: input.shuffleOptions,
      })

      const snapshots = await Promise.all(
        uniqueQuestionIds.map(async (questionId, orderIndex) => {
          const question = await transaction.orm.public.Question.first({ id: questionId })
          if (!question || question.isDeleted) {
            throw new Error('Soal tidak ditemukan atau telah dihapus.')
          }

          const snapshot = await transaction.orm.public.QuestionSnapshot.create({
            questionId: question.id,
            version: question.version,
            text: question.text,
            optionA: question.optionA,
            optionB: question.optionB,
            optionC: question.optionC,
            optionD: question.optionD,
            correctOption: question.correctOption,
          })

          return { snapshot, questionId, orderIndex }
        })
      )

      await Promise.all(
        snapshots.map(({ snapshot, questionId, orderIndex }) =>
          transaction.orm.public.ExamQuestion.create({
            examId: exam.id,
            snapshotId: snapshot.id,
            originalQuestionId: questionId,
            orderIndex,
          })
        )
      )

      return toExamRecord(exam)
    })
  },

  async update(id, input) {
    const db = await getDb()
    const exam = await db.orm.public.Exam.where({ id }).update({
      ...input,
      updatedAt: new Date().toISOString(),
    })
    return exam ? toExamRecord(exam) : null
  },

  async updateStatus(id, status) {
    const db = await getDb()
    const exam = await db.orm.public.Exam.where({ id }).update({
      status,
      updatedAt: new Date().toISOString(),
    })
    return exam ? toExamRecord(exam) : null
  },

  async upsertAssignment(examId, siswaId) {
    const db = await getDb()
    const existing = await db.orm.public.ExamAssignment.first({ examId, siswaId })

    if (existing) {
      return {
        id: existing.id,
        examId: existing.examId,
        siswaId: existing.siswaId,
        createdAt: existing.createdAt,
      }
    }

    const assignment = await db.orm.public.ExamAssignment.create({
      examId,
      siswaId,
    })

    return {
      id: assignment.id,
      examId: assignment.examId,
      siswaId: assignment.siswaId,
      createdAt: assignment.createdAt,
    }
  },
}
