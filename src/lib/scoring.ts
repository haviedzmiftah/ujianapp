export interface DistributionBucket {
  label: string
  range: string
  count: number
}

export interface ReportEntry {
  studentName: string
  finalScore: number
  violations: number
}

export interface ExamSession {
  id: string
  siswaId: string
  finalScore?: number | null
  violations?: { length?: number }[]
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function calculateScore(correctCount: number, totalQuestions: number): number {
  if (totalQuestions <= 0) return 0
  return round2((correctCount / totalQuestions) * 100)
}

export function calculateQuestionCorrectRate(correctCount: number, totalAnswers: number): number {
  if (totalAnswers <= 0) return 0
  return round2((correctCount / totalAnswers) * 100)
}

export function calculateClassAverage(scores: number[]): number {
  if (scores.length === 0) return 0
  return round2(scores.reduce((sum, score) => sum + score, 0) / scores.length)
}

export function buildScoreDistribution(scores: number[]): DistributionBucket[] {
  const buckets = Array.from({ length: 10 }, (_, index) => {
    const start = index * 10
    const end = index === 9 ? 100 : start + 9
    return {
      label: `${start}-${end}`,
      range: `${start}-${end}`,
      count: 0,
    }
  })

  for (const score of scores) {
    const normalized = Math.min(100, Math.max(0, score))
    const bucketIndex = normalized >= 100 ? 9 : Math.floor(normalized / 10)
    buckets[bucketIndex].count += 1
  }

  return buckets
}

export function buildReport(sessions: ExamSession[]): ReportEntry[] {
  return [...sessions]
    .map((session) => ({
      studentName: session.siswaId,
      finalScore: session.finalScore ?? 0,
      violations: session.violations?.length ?? 0,
    }))
    .sort((left, right) => right.finalScore - left.finalScore)
}
