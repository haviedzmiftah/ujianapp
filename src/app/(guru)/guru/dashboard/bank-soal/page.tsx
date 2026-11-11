import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import QuestionBank from '@/components/questions/QuestionBank'
import { ROLE_HOME } from '@/lib/auth/rbac'
import { getSession } from '@/lib/auth/session'
import { listQuestions } from '@/lib/questions/question.service'

const QUESTIONS_PER_PAGE = 20

interface QuestionBankPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default function QuestionBankPage({ searchParams }: QuestionBankPageProps) {
  return (
    <Suspense fallback={<p className="p-8 text-gray-500">Memuat bank soal...</p>}>
      <QuestionBankPageContent searchParams={searchParams} />
    </Suspense>
  )
}

async function QuestionBankPageContent({ searchParams }: QuestionBankPageProps) {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'GURU') redirect(ROLE_HOME[session.role])

  const params = await searchParams
  const pageParam = params.page
  const requestedPage = Number(Array.isArray(pageParam) ? pageParam[0] ?? 1 : pageParam ?? 1)
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
  const result = await listQuestions(session.userId, { page, limit: QUESTIONS_PER_PAGE })
  const lastPage = Math.max(1, Math.ceil(result.total / QUESTIONS_PER_PAGE))
  const currentPage = Math.min(page, lastPage)
  const questions =
    currentPage === result.page
      ? result.items
      : (await listQuestions(session.userId, {
          page: currentPage,
          limit: QUESTIONS_PER_PAGE,
        })).items

  return (
    <main className="mx-auto w-full max-w-6xl p-6 sm:p-8">
      <header className="mb-8">
        <p className="text-sm font-medium text-blue-700">Materi Ujian</p>
        <h1 className="mt-1 text-2xl font-semibold text-gray-900">Bank Soal</h1>
        <p className="mt-2 text-sm text-gray-600">
          Buat, perbarui, dan kelola soal pilihan ganda milik Anda.
        </p>
      </header>
      <QuestionBank
        initialQuestions={questions}
        currentPage={currentPage}
        totalQuestions={result.total}
        pageSize={QUESTIONS_PER_PAGE}
      />
    </main>
  )
}
