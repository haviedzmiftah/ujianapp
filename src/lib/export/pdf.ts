import { jsPDF } from 'jspdf'
import type { ExamReport } from '@/lib/reports/report.service'

function withTimeout<T>(operation: Promise<T>, milliseconds: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Ekspor PDF melebihi batas 30 detik.')), milliseconds)
  })
  return Promise.race([operation, timeout]).finally(() => clearTimeout(timeoutId))
}

export function exportExamReportPdf(report: ExamReport): Promise<void> {
  const operation = Promise.resolve().then(() => {
    const document = new jsPDF()
    document.text(`Laporan: ${report.title}`, 14, 18)
    document.text(`Rata-rata kelas: ${report.classAverage.toFixed(2)}`, 14, 28)

    let y = 42
    document.text('Daftar Nilai', 14, y)
    y += 8
    for (const student of report.students) {
      document.text(`${student.studentName} - ${student.finalScore.toFixed(2)} (${student.violations} violation)`, 14, y)
      y += 7
      if (y > 280) {
        document.addPage()
        y = 20
      }
    }

    y += 8
    document.text('Analisis Soal', 14, y)
    y += 8
    for (const question of report.questionAnalysis) {
      document.text(`${question.text} - Benar ${question.correctRate.toFixed(2)}%`, 14, y)
      y += 7
      if (y > 280) {
        document.addPage()
        y = 20
      }
    }
    document.save(`laporan-${report.examId}.pdf`)
  })
  return withTimeout(operation, 30_000)
}
