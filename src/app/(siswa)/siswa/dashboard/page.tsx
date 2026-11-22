import { Suspense } from 'react'
import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'

export default function SiswaDashboardPage() {
  return (
    <Suspense fallback={<p className="p-8 text-gray-500">Memuat dashboard...</p>}>
      <SiswaDashboardContent />
    </Suspense>
  )
}

async function SiswaDashboardContent() {
  const session = await getSession()
  if (!session || session.role !== 'SISWA') redirect('/login')

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard Siswa</h1>
          <p className="text-sm text-gray-500 mt-1">Selamat datang, {session.name}</p>
        </div>
      </div>
      <a href="/siswa/dashboard/ujian" className="inline-block rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white">
        Lihat Ujian Ditugaskan
      </a>
    </div>
  )
}
