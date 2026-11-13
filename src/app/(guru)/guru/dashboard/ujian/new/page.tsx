import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { ROLE_HOME } from '@/lib/auth/rbac'

export default async function NewExamPage() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'GURU') redirect(ROLE_HOME[session.role])

  return (
    <main className="mx-auto w-full max-w-3xl p-6 sm:p-8">
      <header className="mb-8">
        <p className="text-sm font-medium text-blue-700">Persiapan Ujian</p>
        <h1 className="mt-1 text-2xl font-semibold text-gray-900">Buat Ujian Baru</h1>
      </header>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-600">
          Form pembuatan ujian akan tersedia pada tahap implementasi lanjutan.
        </p>
      </div>
    </main>
  )
}
