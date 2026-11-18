async function getDb() {
  const { db } = await import('@/prisma/db')
  return db
}

export interface ReportExam {
  id: string
  guruId: string
  title: string
}

export interface ReportSession {
  id: string
  siswaId: string
  finalScore: number | null
}

export interface ReportViolationCount {
  sessionId: string
  count: number
}

export interface ReportExamQuestion {
  id: string
  snapshotId: string
  orderIndex: number
  snapshot: {
    text: string
    optionA: string
    optionB: string
    optionC: string
    optionD: string
  }
}

export interface ReportAnswer {
  sessionId: string
  examQuestionId: string
  selectedOption: string
  isCorrect: boolean
}

export interface ReportStudent {
  id: string
  name: string
}

export const reportRepository = {
  async findExam(examId: string): Promise<ReportExam | null> {
    const db = await getDb()
    const exam = await db.orm.public.Exam.first({ id: examId })
    return exam ? { id: exam.id, guruId: exam.guruId, title: exam.title } : null
  },

  async listSubmittedSessions(examId: string): Promise<ReportSession[]> {
    const db = await getDb()
    const sessions = await db.orm.public.ExamSession
      .where({ examId, status: 'SUBMITTED' })
      .all()
    return sessions.map((session) => ({
      id: session.id,
      siswaId: session.siswaId,
      finalScore: session.finalScore === null || session.finalScore === undefined
        ? null
        : Number(session.finalScore),
    }))
  },

  async listStudents(studentIds: string[]): Promise<ReportStudent[]> {
    const db = await getDb()
    const students = await Promise.all(
      studentIds.map(async (studentId) => db.orm.public.User.first({ id: studentId }))
    )
    return students
      .filter((student) => student !== null)
      .map((student) => ({ id: student!.id, name: student!.name }))
  },

  async listViolationCounts(sessionIds: string[]): Promise<ReportViolationCount[]> {
    const db = await getDb()
    return Promise.all(
      sessionIds.map(async (sessionId) => {
        const result = await db.orm.public.Violation.where({ sessionId }).aggregate((aggregate) => ({
          count: aggregate.count(),
        }))
        return { sessionId, count: result.count }
      })
    )
  },

  async listExamQuestions(examId: string): Promise<ReportExamQuestion[]> {
    const db = await getDb()
    const examQuestions = await db.orm.public.ExamQuestion
      .where({ examId })
      .orderBy((question) => question.orderIndex.asc())
      .all()

    const questions = await Promise.all(
      examQuestions.map(async (examQuestion) => {
        const snapshot = await db.orm.public.QuestionSnapshot.first({ id: examQuestion.snapshotId })
        if (!snapshot) return null
        return {
          id: examQuestion.id,
          snapshotId: examQuestion.snapshotId,
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
    return questions.filter((question): question is ReportExamQuestion => question !== null)
  },

  async listAnswersForSessions(sessionIds: string[]): Promise<ReportAnswer[]> {
    const db = await getDb()
    const answers = await Promise.all(
      sessionIds.map(async (sessionId) =>
        db.orm.public.Answer.where({ sessionId }).all()
      )
    )
    return answers.flat().map((answer) => ({
      sessionId: answer.sessionId,
      examQuestionId: answer.examQuestionId,
      selectedOption: answer.selectedOption,
      isCorrect: answer.isCorrect,
    }))
  },
}
