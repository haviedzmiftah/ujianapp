import type { ExamRecord, ExamStatus, ExamAssignmentRecord } from '@/types'
import { examRepository } from './exam.repository'

export class ExamNotFoundError extends Error {
  constructor() {
    super('Ujian tidak ditemukan.')
    this.name = 'ExamNotFoundError'
  }
}

export class ExamForbiddenError extends Error {
  constructor() {
    super('Akses ditolak.')
    this.name = 'ExamForbiddenError'
  }
}

export class ExamStateError extends Error {
  constructor(message = 'Status ujian tidak valid untuk operasi ini.') {
    super(message)
    this.name = 'ExamStateError'
  }
}

export function canPublishExam(status: ExamStatus): boolean {
  return status === 'DRAFT'
}

export function canAssignExam(status: ExamStatus): boolean {
  return status === 'PUBLISHED'
}

export interface ListExamsInput {
  page?: number
  limit?: number
}

export interface CreateExamInput {
  title: string
  durationMinutes: number
  maxViolations?: number
  shuffleQuestions: boolean
  shuffleOptions: boolean
  fullscreenEnabled: boolean
  tabSwitchDetection: boolean
  questionIds: string[]
}

export interface UpdateExamInput {
  title?: string
  durationMinutes?: number
  maxViolations?: number | null
  shuffleQuestions?: boolean
  shuffleOptions?: boolean
  fullscreenEnabled?: boolean
  tabSwitchDetection?: boolean
}

function ensureOwnership(exam: ExamRecord, guruId: string): void {
  if (exam.guruId !== guruId) throw new ExamForbiddenError()
}

export async function listExams(guruId: string, input: ListExamsInput = {}) {
  const page = Math.max(1, Number(input.page ?? 1))
  const limit = Math.min(Math.max(Number(input.limit ?? 20), 1), 100)
  const skip = (page - 1) * limit

  const result = await examRepository.listByOwner(guruId, { skip, take: limit })
  return {
    items: result.items,
    page,
    limit,
    total: result.total,
  }
}

export async function createExam(guruId: string, input: CreateExamInput) {
  return examRepository.create(guruId, {
    title: input.title.trim(),
    durationMinutes: input.durationMinutes,
    maxViolations: input.maxViolations ?? null,
    shuffleQuestions: input.shuffleQuestions,
    shuffleOptions: input.shuffleOptions,
    fullscreenEnabled: input.fullscreenEnabled,
    tabSwitchDetection: input.tabSwitchDetection,
    questionIds: [...new Set(input.questionIds.map((questionId) => questionId.trim()))],
  })
}

export async function updateExam(guruId: string, examId: string, input: UpdateExamInput) {
  const exam = await examRepository.findById(examId)
  if (!exam) throw new ExamNotFoundError()
  ensureOwnership(exam, guruId)

  if (!canPublishExam(exam.status) && Object.keys(input).length > 0) {
    // Status guard only applies to publication changes; other fields remain editable while DRAFT.
  }

  const updatedExam = await examRepository.update(examId, {
    ...exam,
    ...input,
    maxViolations: input.maxViolations ?? exam.maxViolations ?? null,
  })

  if (!updatedExam) throw new ExamNotFoundError()
  return updatedExam
}

export async function publishExam(guruId: string, examId: string) {
  const exam = await examRepository.findById(examId)
  if (!exam) throw new ExamNotFoundError()
  ensureOwnership(exam, guruId)

  if (!canPublishExam(exam.status)) {
    throw new ExamStateError('Ujian hanya dapat dipublikasikan saat status DRAFT.')
  }

  const updatedExam = await examRepository.updateStatus(examId, 'PUBLISHED')
  if (!updatedExam) throw new ExamNotFoundError()
  return updatedExam
}

export async function assignExam(guruId: string, examId: string, siswaId: string) {
  const exam = await examRepository.findById(examId)
  if (!exam) throw new ExamNotFoundError()
  ensureOwnership(exam, guruId)

  if (!canAssignExam(exam.status)) {
    throw new ExamStateError('Ujian hanya dapat ditugaskan saat status PUBLISHED.')
  }

  return examRepository.upsertAssignment(examId, siswaId)
}
