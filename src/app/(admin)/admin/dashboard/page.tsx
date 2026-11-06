import { Suspense } from 'react'
import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { logoutAction } from '@/actions/auth.actions'

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<p className="p-8 text-gray-500">Memuat dashboard...</p>}>
      <AdminDashboardContent />
    </Suspense>
  )
}

async function AdminDashboardContent() {
  const session = await getSession()
  if (!session || session.role !== 'ADMIN') redirect('/login')

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard Admin</h1>
          <p className="text-sm text-gray-500 mt-1">Selamat datang, {session.name}</p>
        </div>
        <form action={logoutAction}>
          <button
            type="submit"
            className="text-sm text-gray-600 hover:text-gray-900 underline"
          >
            Keluar
          </button>
        </form>
      </div>
      <p className="text-gray-600">Kelola pengguna dan konfigurasi sistem.</p>
    </div>
  )
}
