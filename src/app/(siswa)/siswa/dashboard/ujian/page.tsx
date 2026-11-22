import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { listAssignedExams } from '@/lib/exam-sessions/exam-session.service'

const statusLabels = {
  NOT_STARTED: 'Belum dikerjakan',
  IN_PROGRESS: 'Sedang dikerjakan',
  FINISHED: 'Selesai',
} as const

export default function StudentExamsPage() {
  return (
    <Suspense fallback={<main className="p-8 text-gray-500">Memuat daftar ujian...</main>}>
      <StudentExamsContent />
    </Suspense>
  )
}

async function StudentExamsContent() {
  const session = await getSession()
  if (!session || session.role !== 'SISWA') redirect('/login')

  const exams = await listAssignedExams(session.userId)
  return (
    <main className="mx-auto min-h-screen max-w-5xl p-6 sm:p-8">
      <header className="mb-6">
        <p className="text-sm font-medium text-blue-700">Ujian Saya</p>
        <h1 className="mt-1 text-2xl font-semibold text-gray-900">Daftar Ujian Ditugaskan</h1>
      </header>

      {exams.length === 0 ? (
        <p className="rounded-xl border border-gray-200 bg-white p-6 text-gray-600">
          Belum ada ujian yang ditugaskan.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {exams.map((exam) => (
            <article key={exam.examId} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-semibold text-gray-900">{exam.title}</h2>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                  {statusLabels[exam.status]}
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-500">{exam.durationMinutes} menit</p>
              {exam.status === 'FINISHED' ? (
                <a
                  href={`/siswa/dashboard/ujian/${exam.examId}/hasil`}
                  className="mt-4 inline-block rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-800"
                >
                  Lihat Hasil
                </a>
              ) : (
                <a
                  href={`/siswa/dashboard/ujian/${exam.examId}/kerjakan`}
                  className="mt-4 inline-block rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white"
                >
                  {exam.status === 'IN_PROGRESS' ? 'Lanjutkan Ujian' : 'Mulai Ujian'}
                </a>
              )}
            </article>
          ))}
        </div>
      )}
    </main>
  )
}
