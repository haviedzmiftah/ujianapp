import * as XLSX from 'xlsx'
import type { ExamReport } from '@/lib/reports/report.service'

function withTimeout<T>(operation: Promise<T>, milliseconds: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error('Ekspor Excel melebihi batas 30 detik.')), milliseconds)
  })
  return Promise.race([operation, timeout]).finally(() => clearTimeout(timeoutId))
}

export function exportExamReportExcel(report: ExamReport): Promise<void> {
  const operation = Promise.resolve().then(() => {
    const rows = report.students.map((student) => ({
      Nama: student.studentName,
      'Nilai Akhir': student.finalScore,
      Violation: student.violations,
    }))
    const worksheet = XLSX.utils.json_to_sheet(rows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Nilai Siswa')
    XLSX.writeFile(workbook, `laporan-${report.examId}.xlsx`)
  })
  return withTimeout(operation, 30_000)
}
