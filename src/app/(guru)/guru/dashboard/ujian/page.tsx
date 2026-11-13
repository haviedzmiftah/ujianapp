import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { ROLE_HOME } from '@/lib/auth/rbac'
import { listExams } from '@/lib/exams/exam.service'

const EXAMS_PER_PAGE = 20

interface ExamPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ExamsPage({ searchParams }: ExamPageProps) {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'GURU') redirect(ROLE_HOME[session.role])

  const params = await searchParams
  const pageParam = params.page
  const requestedPage = Number(Array.isArray(pageParam) ? pageParam[0] ?? 1 : pageParam ?? 1)
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
  const result = await listExams(session.userId, { page, limit: EXAMS_PER_PAGE })

  return (
    <main className="mx-auto w-full max-w-6xl p-6 sm:p-8">
      <header className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-blue-700">Persiapan Ujian</p>
          <h1 className="mt-1 text-2xl font-semibold text-gray-900">Daftar Ujian</h1>
        </div>
        <a
          href="/guru/dashboard/ujian/new"
          className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Buat Ujian
        </a>
      </header>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        {result.items.length === 0 ? (
          <p className="text-sm text-gray-500">Belum ada ujian yang dibuat.</p>
        ) : (
          <div className="space-y-3">
            {result.items.map((exam) => (
              <div key={exam.id} className="flex items-center justify-between rounded border border-gray-200 p-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{exam.title}</h2>
                  <p className="text-sm text-gray-600">
                    {exam.durationMinutes} menit • Status: {exam.status}
                  </p>
                </div>
                <div className="flex gap-2">
                  <a href={`/guru/dashboard/laporan/${exam.id}`} className="rounded border px-3 py-2 text-sm text-gray-700">
                    Laporan
                  </a>
                  <a href={`/guru/dashboard/ujian/new?edit=${exam.id}`} className="rounded border px-3 py-2 text-sm text-gray-700">
                    Edit
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
