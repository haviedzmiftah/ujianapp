import { examSessionRepository } from './exam-session.repository'

export class ExamSessionConflictError extends Error {
  constructor() {
    super('Sesi ujian aktif untuk siswa dan ujian ini sudah ada.')
    this.name = 'ExamSessionConflictError'
  }
}

export class ExamSessionAccessError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ExamSessionAccessError'
  }
}

export async function createOrResumeExamSession(examId: string, siswaId: string) {
  const exam = await examSessionRepository.findExam(examId)
  if (!exam) throw new ExamSessionAccessError('Ujian tidak ditemukan.')
  if (exam.status !== 'PUBLISHED') {
    throw new ExamSessionAccessError('Ujian belum dipublikasikan.')
  }
  if (!(await examSessionRepository.isAssigned(examId, siswaId))) {
    throw new ExamSessionAccessError('Anda tidak ditugaskan pada ujian ini.')
  }

  const activeSession = await examSessionRepository.findActive(examId, siswaId)
  if (activeSession) {
    const resumed = await examSessionRepository.resume(activeSession.id)
    if (!resumed) throw new ExamSessionAccessError('Sesi ujian tidak ditemukan.')
    return { ...resumed, isResumed: true }
  }

  try {
    const created = await examSessionRepository.create(examId, siswaId)
    return {
      session: created.session,
      sessionOrder: created.sessionOrder,
      remainingSeconds: created.session.remainingSeconds,
      answers: [],
      isResumed: false,
    }
  } catch (error) {
    const existingSession = await examSessionRepository.findActive(examId, siswaId)
    if (existingSession) throw new ExamSessionConflictError()
    throw error
  }
}
