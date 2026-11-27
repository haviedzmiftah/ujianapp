import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { ROLE_HOME } from '@/lib/auth/rbac'
import { listClasses } from '@/lib/classes/class.service'
import { ClassManagement } from '@/components/admin/ClassManagement'

export default function AdminClassesPage() {
  return (
    <Suspense fallback={<p className="p-8 text-slate-500">Memuat daftar kelas...</p>}>
      <AdminClassesContent />
    </Suspense>
  )
}

async function AdminClassesContent() {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'ADMIN') redirect(ROLE_HOME[session.role])

  const classes = await listClasses()

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Manajemen Kelas</h1>
          <p className="mt-1 text-sm text-slate-500">
            Daftarkan rombongan belajar (kelas), tentukan jenjang, dan kelola siswa pada setiap kelas.
          </p>
        </div>
      </header>

      <ClassManagement initialClasses={classes} />
    </div>
  )
}
