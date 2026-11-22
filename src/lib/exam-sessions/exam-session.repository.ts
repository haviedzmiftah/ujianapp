import type {
  ExamEnginePayload,
  ExamQuestionPayload,
  ExamSessionRecord,
  QuestionOption,
  SessionOrderRecord,
  ViolationType,
} from '@/types'
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
  async findSession(examId: string, siswaId: string): Promise<ExamSessionRecord | null> {
    const db = await getDb()
    const session = await db.orm.public.ExamSession.first({ examId, siswaId })
    return session ? toExamSessionRecord(session) : null
  },

  async findByIdOwned(sessionId: string, siswaId: string): Promise<ExamSessionRecord | null> {
    const db = await getDb()
    const session = await db.orm.public.ExamSession.first({ id: sessionId, siswaId })
    return session ? toExamSessionRecord(session) : null
  },

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

  async getEnginePayload(sessionId: string, siswaId: string): Promise<ExamEnginePayload | null> {
    const db = await getDb()
    const session = await db.orm.public.ExamSession.first({ id: sessionId, siswaId })
    if (!session) return null

    const exam = await db.orm.public.Exam.first({ id: session.examId })
    if (!exam) return null
    const examQuestions = await db.orm.public.ExamQuestion
      .where({ examId: exam.id })
      .orderBy((question) => question.orderIndex.asc())
      .all()
    const questionPayloads = await Promise.all(
      examQuestions.map(async (examQuestion): Promise<ExamQuestionPayload> => {
        const snapshot = await db.orm.public.QuestionSnapshot.first({ id: examQuestion.snapshotId })
        if (!snapshot) throw new Error('Snapshot soal tidak ditemukan.')
        return {
          id: examQuestion.id,
          orderIndex: examQuestion.orderIndex,
          snapshot: {
            text: snapshot.text,
            optionA: snapshot.optionA,
            optionB: snapshot.optionB,
            optionC: snapshot.optionC,
            optionD: snapshot.optionD,
          },
        }
      })
    )
    const savedOrder = await db.orm.public.SessionOrder.first({ sessionId })
    if (!savedOrder) throw new Error('Urutan soal sesi tidak ditemukan.')
    const answers = await db.orm.public.Answer.where({ sessionId }).all()
    const violationResult = await db.orm.public.Violation
      .where({ sessionId })
      .aggregate((aggregate) => ({ count: aggregate.count() }))

    return {
      exam: {
        id: exam.id,
        title: exam.title,
        fullscreenEnabled: exam.fullscreenEnabled,
        tabSwitchDetection: exam.tabSwitchDetection,
        maxViolations: exam.maxViolations,
      },
      session: toExamSessionRecord(session),
      sessionOrder: {
        id: savedOrder.id,
        sessionId: savedOrder.sessionId,
        questionOrder: savedOrder.questionOrder,
        optionOrders: savedOrder.optionOrders as Record<string, readonly QuestionOption[]>,
      },
      remainingSeconds: session.remainingSeconds,
      violationCount: violationResult.count,
      answers: answers.map((answer) => ({
        examQuestionId: answer.examQuestionId,
        selectedOption: answer.selectedOption as QuestionOption,
      })),
      questions: questionPayloads,
    }
  },

  async upsertAnswer(
    sessionId: string,
    examQuestionId: string,
    selectedOption: QuestionOption
  ) {
    const db = await getDb()
    const examQuestion = await db.orm.public.ExamQuestion.first({ id: examQuestionId })
    if (!examQuestion) throw new Error('Soal ujian tidak ditemukan.')
    const snapshot = await db.orm.public.QuestionSnapshot.first({ id: examQuestion.snapshotId })
    if (!snapshot) throw new Error('Snapshot soal tidak ditemukan.')

    const existing = await db.orm.public.Answer.first({ sessionId, examQuestionId })
    const answerData = {
      sessionId,
      examQuestionId,
      snapshotId: snapshot.id,
      selectedOption,
      isCorrect: snapshot.correctOption === selectedOption,
      answeredAt: new Date().toISOString(),
    }

    if (existing) {
      const updated = await db.orm.public.Answer
        .where({ id: existing.id })
        .update(answerData)
      return updated
    }
    return db.orm.public.Answer.create(answerData)
  },

  async countAnswers(sessionId: string): Promise<number> {
    const db = await getDb()
    const result = await db.orm.public.Answer
      .where({ sessionId })
      .aggregate((aggregate) => ({ count: aggregate.count() }))
    return result.count
  },

  async submit(sessionId: string): Promise<{ finalScore: number; submittedAt: string }> {
    const db = await getDb()
    const session = await db.orm.public.ExamSession.first({ id: sessionId })
    if (!session) throw new Error('Sesi ujian tidak ditemukan.')
    if (session.status !== 'ACTIVE') throw new Error('Sesi ujian telah berakhir.')

    const answers = await db.orm.public.Answer.where({ sessionId }).all()
    const examQuestions = await db.orm.public.ExamQuestion
      .where({ examId: session.examId })
      .all()
    const correctCount = answers.filter((answer) => answer.isCorrect).length
    const rawScore = examQuestions.length === 0
      ? 0
      : (correctCount / examQuestions.length) * 100
    const finalScore = Math.round((rawScore + Number.EPSILON) * 100) / 100
    const submittedAt = new Date().toISOString()

    await db.orm.public.ExamSession
      .where({ id: sessionId })
      .update({ status: 'SUBMITTED', submittedAt, finalScore: String(finalScore), remainingSeconds: 0 })

    return { finalScore, submittedAt }
  },

  async updateRemainingSeconds(sessionId: string, remainingSeconds: number): Promise<void> {
    const db = await getDb()
    await db.orm.public.ExamSession
      .where({ id: sessionId })
      .update({ remainingSeconds: Math.max(0, remainingSeconds) })
  },

  async addViolation(
    sessionId: string,
    type: ViolationType
  ): Promise<{ violationCount: number; shouldSubmit: boolean }> {
    const db = await getDb()
    const session = await db.orm.public.ExamSession.first({ id: sessionId })
    if (!session || session.status !== 'ACTIVE') {
      throw new Error('Sesi ujian tidak aktif.')
    }
    await db.orm.public.Violation.create({
      sessionId,
      type,
      occurredAt: new Date().toISOString(),
    })
    const exam = await db.orm.public.Exam.first({ id: session.examId })
    const result = await db.orm.public.Violation
      .where({ sessionId })
      .aggregate((aggregate) => ({ count: aggregate.count() }))
    const maxViolations = exam?.maxViolations ?? 100
    return {
      violationCount: result.count,
      shouldSubmit: result.count >= maxViolations,
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
