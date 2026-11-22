import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { getSession } from '@/lib/auth/session'
import { ROLE_HOME } from '@/lib/auth/rbac'
import {
  buildExamReport,
  ReportForbiddenError,
  ReportNotFoundError,
} from '@/lib/reports/report.service'
import GradeTable from '@/components/reports/GradeTable'
import QuestionAnalysisTable from '@/components/reports/QuestionAnalysisTable'
import GradeDistributionChart from '@/components/reports/GradeDistributionChart'
import ExportButtons from '@/components/reports/ExportButtons'

export const instant = false

export default function ReportPage({
  params,
}: {
  params: Promise<{ examId: string }>
}) {
  return (
    <Suspense fallback={<main className="p-8">Memuat laporan ujian...</main>}>
      <ReportContent params={params} />
    </Suspense>
  )
}

async function ReportContent({
  params,
}: {
  params: Promise<{ examId: string }>
}) {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'GURU') redirect(ROLE_HOME[session.role])

  const { examId } = await params
  try {
    const report = await buildExamReport(session.userId, examId)
    return (
      <main className="mx-auto w-full max-w-6xl space-y-8 p-6 sm:p-8">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-blue-700">Laporan Ujian</p>
            <h1 className="mt-1 text-2xl font-semibold text-gray-900">{report.title}</h1>
            <p className="mt-2 text-sm text-gray-600">
              Rata-rata kelas: <strong>{report.classAverage.toFixed(2)}</strong>
            </p>
          </div>
          <ExportButtons report={report} />
        </header>
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Daftar Nilai Siswa</h2>
          <GradeTable students={report.students} />
        </section>
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Distribusi Nilai</h2>
          <GradeDistributionChart distribution={report.distribution} />
        </section>
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Analisis Per Soal</h2>
          <QuestionAnalysisTable questionAnalysis={report.questionAnalysis} />
        </section>
      </main>
    )
  } catch (error) {
    if (error instanceof ReportNotFoundError) return <main className="p-8">{error.message}</main>
    if (error instanceof ReportForbiddenError) return <main className="p-8">{error.message}</main>
    return <main className="p-8">Gagal mengambil laporan ujian.</main>
  }
}
