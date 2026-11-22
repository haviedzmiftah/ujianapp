import { examSessionRepository } from './exam-session.repository'
import type { QuestionOption, ViolationType } from '@/types'

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
  const existingSession = await examSessionRepository.findSession(examId, siswaId)
  if (existingSession && existingSession.status !== 'ACTIVE') {
    throw new ExamSessionAccessError(
      'Sesi ujian ini telah berakhir dan tidak dapat dilanjutkan.'
    )
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

export async function saveExamAnswer(
  sessionId: string,
  siswaId: string,
  examQuestionId: string,
  selectedOption: QuestionOption
) {
  const session = await examSessionRepository.findByIdOwned(sessionId, siswaId)
  if (!session) throw new ExamSessionAccessError('Sesi ujian tidak ditemukan.')
  if (session.status !== 'ACTIVE') {
    throw new ExamSessionAccessError('Sesi ujian ini telah berakhir dan tidak dapat dilanjutkan.')
  }
  return examSessionRepository.upsertAnswer(sessionId, examQuestionId, selectedOption)
}

export async function submitExamSession(
  sessionId: string,
  siswaId: string,
  localAnswerCount?: number
) {
  const session = await examSessionRepository.findByIdOwned(sessionId, siswaId)
  if (!session) throw new ExamSessionAccessError('Sesi ujian tidak ditemukan.')
  if (session.status !== 'ACTIVE') {
    throw new ExamSessionAccessError('Sesi ujian ini telah berakhir dan tidak dapat dilanjutkan.')
  }
  if (localAnswerCount !== undefined) {
    const serverAnswerCount = await examSessionRepository.countAnswers(sessionId)
    if (localAnswerCount > serverAnswerCount) {
      throw new ExamSessionAccessError('Jawaban lokal belum sinkron sepenuhnya.')
    }
  }
  return examSessionRepository.submit(sessionId)
}

export async function syncExamRemainingTime(
  sessionId: string,
  siswaId: string,
  remainingSeconds: number
) {
  const session = await examSessionRepository.findByIdOwned(sessionId, siswaId)
  if (!session) throw new ExamSessionAccessError('Sesi ujian tidak ditemukan.')
  if (session.status !== 'ACTIVE') {
    throw new ExamSessionAccessError('Sesi ujian ini telah berakhir.')
  }
  await examSessionRepository.updateRemainingSeconds(sessionId, remainingSeconds)
  return { remainingSeconds: Math.max(0, remainingSeconds) }
}

export async function recordExamViolation(
  sessionId: string,
  siswaId: string,
  type: ViolationType
) {
  const session = await examSessionRepository.findByIdOwned(sessionId, siswaId)
  if (!session) throw new ExamSessionAccessError('Sesi ujian tidak ditemukan.')
  if (session.status !== 'ACTIVE') {
    throw new ExamSessionAccessError('Sesi ujian ini telah berakhir.')
  }
  const result = await examSessionRepository.addViolation(sessionId, type)
  return result
}

export async function getExamEnginePayload(sessionId: string, siswaId: string) {
  const payload = await examSessionRepository.getEnginePayload(sessionId, siswaId)
  if (!payload) throw new ExamSessionAccessError('Sesi ujian tidak ditemukan.')
  if (payload.session.status !== 'ACTIVE') {
    throw new ExamSessionAccessError(
      'Sesi ujian ini telah berakhir dan tidak dapat dilanjutkan.'
    )
  }
  return payload
}

export async function listAssignedExams(siswaId: string) {
  return examSessionRepository.listAssignedExams(siswaId)
}

export async function getExamResult(examId: string, siswaId: string) {
  const result = await examSessionRepository.getExamResult(examId, siswaId)
  if (!result) throw new ExamSessionAccessError('Sesi ujian tidak ditemukan.')
  return result
}
