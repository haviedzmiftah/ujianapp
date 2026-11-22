import { Suspense } from 'react'
import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'

export default function GuruDashboardPage() {
  return (
    <Suspense fallback={<p className="p-8 text-gray-500">Memuat dashboard...</p>}>
      <GuruDashboardContent />
    </Suspense>
  )
}

async function GuruDashboardContent() {
  const session = await getSession()
  if (!session || session.role !== 'GURU') redirect('/login')

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard Guru</h1>
          <p className="text-sm text-gray-500 mt-1">Selamat datang, {session.name}</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <a href="/guru/dashboard/bank-soal" className="rounded-xl border border-gray-200 bg-white p-5 font-semibold text-gray-900 hover:border-blue-300">Bank Soal</a>
        <a href="/guru/dashboard/ujian" className="rounded-xl border border-gray-200 bg-white p-5 font-semibold text-gray-900 hover:border-blue-300">Kelola Ujian</a>
        <a href="/guru/dashboard/ujian" className="rounded-xl border border-gray-200 bg-white p-5 font-semibold text-gray-900 hover:border-blue-300">Lihat Laporan</a>
      </div>
    </div>
  )
}
