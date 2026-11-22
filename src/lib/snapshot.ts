import type { QuestionOption, QuestionSnapshotRecord } from '@/types'

export interface SnapshotQuestion {
  id: string
  text: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctOption: QuestionOption
  version: number
}

export type QuestionSnapshot = QuestionSnapshotRecord

async function getDb() {
  const { db } = await import('@/prisma/db')
  return db
}

export async function createSnapshot(question: SnapshotQuestion): Promise<QuestionSnapshot> {
  const db = await getDb()
  const snapshot = await db.orm.public.QuestionSnapshot.create({
    questionId: question.id,
    version: question.version,
    text: question.text,
    optionA: question.optionA,
    optionB: question.optionB,
    optionC: question.optionC,
    optionD: question.optionD,
    correctOption: question.correctOption,
  })

  return toQuestionSnapshotRecord(snapshot)
}

export async function getSnapshot(id: string): Promise<QuestionSnapshot> {
  const db = await getDb()
  const snapshot = await db.orm.public.QuestionSnapshot.first({ id })
  if (!snapshot) throw new Error('Snapshot soal tidak ditemukan.')
  return toQuestionSnapshotRecord(snapshot)
}

function toQuestionSnapshotRecord(snapshot: {
  id: string
  questionId: string
  version: number
  text: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctOption: string
  createdAt: string
}): QuestionSnapshot {
  return {
    id: snapshot.id,
    questionId: snapshot.questionId,
    version: snapshot.version,
    text: snapshot.text,
    optionA: snapshot.optionA,
    optionB: snapshot.optionB,
    optionC: snapshot.optionC,
    optionD: snapshot.optionD,
    correctOption: snapshot.correctOption as QuestionOption,
    createdAt: snapshot.createdAt,
  }
}
