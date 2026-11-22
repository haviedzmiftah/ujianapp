import type { ExamSessionRecord, QuestionOption, SessionOrderRecord } from '@/types'
import { generateSessionOrder, type GeneratedSessionOrder } from '@/lib/shuffle'

async function getDb() {
  const { db } = await import('@/prisma/db')
  return db
}

export interface ExamSessionCreationResult {
  session: ExamSessionRecord
  sessionOrder: GeneratedSessionOrder
}

export interface ResumableExamSession {
  session: ExamSessionRecord
  sessionOrder: SessionOrderRecord
  remainingSeconds: number
  answers: Array<{
    examQuestionId: string
    selectedOption: string
  }>
}

export const examSessionRepository = {
  async findActive(examId: string, siswaId: string): Promise<ExamSessionRecord | null> {
    const db = await getDb()
    const session = await db.orm.public.ExamSession.first({ examId, siswaId })
    if (!session || session.status !== 'ACTIVE') return null
    return toExamSessionRecord(session)
  },

  async findExam(examId: string) {
    const db = await getDb()
    const exam = await db.orm.public.Exam.first({ id: examId })
    if (!exam) return null
    return {
      id: exam.id,
      durationMinutes: exam.durationMinutes,
      status: exam.status,
      shuffleQuestions: exam.shuffleQuestions,
      shuffleOptions: exam.shuffleOptions,
    }
  },

  async isAssigned(examId: string, siswaId: string): Promise<boolean> {
    const db = await getDb()
    const assignment = await db.orm.public.ExamAssignment.first({ examId, siswaId })
    return assignment !== null
  },

  async create(examId: string, siswaId: string): Promise<ExamSessionCreationResult> {
    const db = await getDb()
    const exam = await db.orm.public.Exam.first({ id: examId })
    if (!exam) throw new Error('Ujian tidak ditemukan.')

    const examQuestions = await db.orm.public.ExamQuestion
      .where({ examId })
      .orderBy((question) => question.orderIndex.asc())
      .all()
    if (examQuestions.length === 0) throw new Error('Ujian belum memiliki soal.')

    const sessionOrder = generateSessionOrder(
      examQuestions,
      exam.shuffleQuestions,
      exam.shuffleOptions
    )

    return db.transaction(async (transaction) => {
      const session = await transaction.orm.public.ExamSession.create({
        examId,
        siswaId,
        status: 'ACTIVE',
        remainingSeconds: exam.durationMinutes * 60,
      })

      await transaction.orm.public.SessionOrder.create({
        sessionId: session.id,
        questionOrder: sessionOrder.questionOrder,
        optionOrders: sessionOrder.optionOrders,
      })

      return {
        session: toExamSessionRecord(session),
        sessionOrder,
      }
    })
  },

  async resume(sessionId: string): Promise<ResumableExamSession | null> {
    const db = await getDb()
    const session = await db.orm.public.ExamSession.first({ id: sessionId })
    if (!session) return null

    const savedOrder = await db.orm.public.SessionOrder.first({ sessionId })
    if (!savedOrder) throw new Error('Urutan soal sesi tidak ditemukan.')

    const answers = await db.orm.public.Answer
      .where({ sessionId })
      .all()

    const sessionRecord = toExamSessionRecord(session)
    return {
      session: sessionRecord,
      sessionOrder: {
        id: savedOrder.id,
        sessionId: savedOrder.sessionId,
        questionOrder: savedOrder.questionOrder,
        optionOrders: savedOrder.optionOrders as Record<string, readonly QuestionOption[]>,
      },
      remainingSeconds: session.remainingSeconds,
      answers: answers.map((answer) => ({
        examQuestionId: answer.examQuestionId,
        selectedOption: answer.selectedOption,
      })),
    }
  },
}

function toExamSessionRecord(session: {
  id: string
  examId: string
  siswaId: string
  status: 'ACTIVE' | 'SUBMITTED' | 'EXPIRED'
  startedAt: string
  submittedAt: string | null
  remainingSeconds: number
  finalScore: string | number | null
}): ExamSessionRecord {
  return {
    id: session.id,
    examId: session.examId,
    siswaId: session.siswaId,
    status: session.status,
    startedAt: session.startedAt,
    submittedAt: session.submittedAt,
    remainingSeconds: session.remainingSeconds,
    finalScore: session.finalScore === null ? null : String(session.finalScore),
  }
}
