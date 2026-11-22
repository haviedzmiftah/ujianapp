import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { getExamResult } from '@/lib/exam-sessions/exam-session.service'

interface ExamResultPageProps {
  params: Promise<{ examId: string }>
}

export default function ExamResultPage({ params }: ExamResultPageProps) {
  return (
    <Suspense fallback={<main className="p-8 text-gray-500">Memuat hasil ujian...</main>}>
      <ExamResultContent params={params} />
    </Suspense>
  )
}

async function ExamResultContent({ params }: ExamResultPageProps) {
  const session = await getSession()
  if (!session || session.role !== 'SISWA') redirect('/login')

  const { examId } = await params
  const result = await getExamResult(examId, session.userId)
  if (result.sessionStatus === 'ACTIVE') {
    redirect(`/siswa/dashboard/ujian/${examId}/kerjakan`)
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl p-6 sm:p-8">
      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <p className="text-sm font-medium text-blue-700">Hasil Ujian</p>
        <h1 className="mt-1 text-2xl font-semibold text-gray-900">{result.examTitle}</h1>
        <div className="mt-6 rounded-lg bg-blue-50 p-5 text-center">
          <p className="text-sm text-blue-700">Nilai Akhir</p>
          <p className="mt-1 text-4xl font-bold text-blue-900">{result.finalScore.toFixed(2)}</p>
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ['Jawaban Benar', result.correctCount],
            ['Jawaban Salah', result.incorrectCount],
            ['Belum Dijawab', result.unansweredCount],
            ['Pelanggaran', result.violationCount],
          ].map(([label, value]) => (
            <div key={String(label)} className="rounded-lg border border-gray-200 p-4 text-center">
              <dt className="text-xs text-gray-500">{label}</dt>
              <dd className="mt-1 text-xl font-semibold text-gray-900">{value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  )
}
