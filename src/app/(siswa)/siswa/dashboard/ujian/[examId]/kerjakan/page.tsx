import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import {
  createOrResumeExamSession,
  getExamEnginePayload,
  ExamSessionAccessError,
} from '@/lib/exam-sessions/exam-session.service'
import { ExamEngine } from '@/components/exam/ExamEngine'

interface ExamWorkPageProps {
  params: Promise<{ examId: string }>
}

export default async function ExamWorkPage({ params }: ExamWorkPageProps) {
  const auth = await getSession()
  if (!auth || auth.role !== 'SISWA') redirect('/login')

  const { examId } = await params
  try {
    const createdOrResumed = await createOrResumeExamSession(examId, auth.userId)
    const payload = await getExamEnginePayload(createdOrResumed.session.id, auth.userId)
    return <ExamEngine payload={payload} />
  } catch (error) {
    if (error instanceof ExamSessionAccessError) {
      return (
        <div className="min-h-screen bg-gray-50 p-8">
          <div className="mx-auto max-w-xl rounded-xl border border-red-200 bg-red-50 p-6">
            <h1 className="text-lg font-semibold text-red-800">Sesi ujian tidak dapat dibuka</h1>
            <p className="mt-2 text-red-700">{error.message}</p>
          </div>
        </div>
      )
    }
    throw error
  }
}
