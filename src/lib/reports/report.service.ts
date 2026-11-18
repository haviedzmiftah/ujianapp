import {
  buildReport,
  buildScoreDistribution,
  calculateClassAverage,
  calculateQuestionCorrectRate,
  calculateScore,
  type DistributionBucket,
  type ReportEntry,
} from '@/lib/scoring'
import { reportRepository } from './report.repository'

export class ReportNotFoundError extends Error {
  constructor() {
    super('Laporan tidak tersedia karena belum ada sesi ujian yang selesai.')
  }
}

export class ReportForbiddenError extends Error {
  constructor() {
    super('Akses ditolak.')
  }
}

export interface QuestionAnalysis {
  examQuestionId: string
  text: string
  correctRate: number
  optionCounts: Record<'A' | 'B' | 'C' | 'D', number>
  options: Record<'A' | 'B' | 'C' | 'D', string>
}

export interface ExamReport {
  examId: string
  title: string
  students: ReportEntry[]
  classAverage: number
  distribution: DistributionBucket[]
  questionAnalysis: QuestionAnalysis[]
}

export async function buildExamReport(guruId: string, examId: string): Promise<ExamReport> {
  const exam = await reportRepository.findExam(examId)
  if (!exam) throw new ReportNotFoundError()
  if (exam.guruId !== guruId) throw new ReportForbiddenError()

  const sessions = await reportRepository.listSubmittedSessions(examId)
  if (sessions.length === 0) throw new ReportNotFoundError()

  const sessionIds = sessions.map((session) => session.id)
  const [students, violations, examQuestions, answers] = await Promise.all([
    reportRepository.listStudents(sessions.map((session) => session.siswaId)),
    reportRepository.listViolationCounts(sessionIds),
    reportRepository.listExamQuestions(examId),
    reportRepository.listAnswersForSessions(sessionIds),
  ])
  const studentNames = new Map(students.map((student) => [student.id, student.name]))
  const violationCounts = new Map(violations.map((violation) => [violation.sessionId, violation.count]))

  const reportSessions = sessions.map((session) => {
    const sessionAnswers = answers.filter((answer) => answer.sessionId === session.id)
    const score = session.finalScore ?? calculateScore(
      sessionAnswers.filter((answer) => answer.isCorrect).length,
      examQuestions.length
    )
    return {
      id: session.id,
      siswaId: session.siswaId,
      studentName: studentNames.get(session.siswaId) ?? session.siswaId,
      finalScore: score,
      violations: violationCounts.get(session.id) ?? 0,
    }
  })
  const studentsReport = buildReport(reportSessions)
  const scores = reportSessions.map((session) => session.finalScore)

  return {
    examId,
    title: exam.title,
    students: studentsReport,
    classAverage: calculateClassAverage(scores),
    distribution: buildScoreDistribution(scores),
    questionAnalysis: buildQuestionAnalysis(examQuestions, answers),
  }
}

function buildQuestionAnalysis(
  examQuestions: Awaited<ReturnType<typeof reportRepository.listExamQuestions>>,
  answers: Awaited<ReturnType<typeof reportRepository.listAnswersForSessions>>
): QuestionAnalysis[] {
  return examQuestions.map((question) => {
    const questionAnswers = answers.filter((answer) => answer.examQuestionId === question.id)
    const optionCounts = { A: 0, B: 0, C: 0, D: 0 }
    for (const answer of questionAnswers) {
      if (answer.selectedOption in optionCounts) {
        const option = answer.selectedOption as 'A' | 'B' | 'C' | 'D'
        optionCounts[option] += 1
      }
    }
    const correctCount = questionAnswers.filter((answer) => answer.isCorrect).length
    return {
      examQuestionId: question.id,
      text: question.snapshot.text,
      correctRate: calculateQuestionCorrectRate(correctCount, questionAnswers.length),
      optionCounts,
      options: {
        A: question.snapshot.optionA,
        B: question.snapshot.optionB,
        C: question.snapshot.optionC,
        D: question.snapshot.optionD,
      },
    }
  })
}
