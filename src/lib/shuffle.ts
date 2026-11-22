import type { QuestionOption, SessionOrderRecord } from '@/types'

export interface ShufflableExamQuestion {
  id: string
}

export interface GeneratedSessionOrder {
  questionOrder: string[]
  optionOrders: Record<string, QuestionOption[]>
}

export function fisherYatesShuffle<T>(arr: readonly T[]): T[] {
  const shuffled = [...arr]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]]
  }

  return shuffled
}

export function generateSessionOrder(
  examQuestions: readonly ShufflableExamQuestion[],
  shuffleQuestions: boolean,
  shuffleOptions: boolean
): GeneratedSessionOrder {
  const questionOrder = shuffleQuestions
    ? fisherYatesShuffle(examQuestions.map((question) => question.id))
    : examQuestions.map((question) => question.id)
  const optionOrders: Record<string, QuestionOption[]> = {}

  for (const question of examQuestions) {
    const options: QuestionOption[] = ['A', 'B', 'C', 'D']
    optionOrders[question.id] = shuffleOptions
      ? fisherYatesShuffle(options)
      : options
  }

  return { questionOrder, optionOrders }
}

async function getDb() {
  const { db } = await import('@/prisma/db')
  return db
}

export async function saveSessionOrder(
  sessionId: string,
  order: GeneratedSessionOrder
): Promise<void> {
  const db = await getDb()
  await db.orm.public.SessionOrder.create({
    sessionId,
    questionOrder: order.questionOrder,
    optionOrders: order.optionOrders,
  })
}

export async function getSessionOrder(
  sessionId: string
): Promise<SessionOrderRecord> {
  const db = await getDb()
  const savedOrder = await db.orm.public.SessionOrder.first({ sessionId })
  if (!savedOrder) {
    throw new Error('Urutan soal sesi tidak ditemukan.')
  }

  return {
    id: savedOrder.id,
    sessionId: savedOrder.sessionId,
    questionOrder: savedOrder.questionOrder,
    optionOrders: savedOrder.optionOrders as Record<string, readonly QuestionOption[]>,
  }
}
