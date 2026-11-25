import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { ROLE_HOME } from '@/lib/auth/rbac'
import { listUsers } from '@/lib/users/user.service'
import UserManagement from '@/components/admin/UserManagement'

const USERS_PER_PAGE = 20

interface UsersPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default function UsersPage({ searchParams }: UsersPageProps) {
  return (
    <Suspense fallback={<p className="p-8 text-slate-500">Memuat daftar pengguna...</p>}>
      <UsersPageContent searchParams={searchParams} />
    </Suspense>
  )
}

async function UsersPageContent({ searchParams }: UsersPageProps) {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'ADMIN') redirect(ROLE_HOME[session.role])

  const params = await searchParams
  const pageParam = params.page
  const requestedPage = Number(Array.isArray(pageParam) ? pageParam[0] ?? 1 : pageParam ?? 1)
  const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
  const result = await listUsers({ page, limit: USERS_PER_PAGE })
  const lastPage = Math.max(1, Math.ceil(result.total / USERS_PER_PAGE))
  const currentPage = Math.min(page, lastPage)
  const users =
    currentPage === result.page
      ? result.items
      : (await listUsers({ page: currentPage, limit: USERS_PER_PAGE })).items

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Manajemen Pengguna</h1>
          <p className="mt-1 text-sm text-slate-500">
            Kelola data akun Guru dan Siswa, hak akses peran, serta status aktifasi akun.
          </p>
        </div>
      </header>

      <UserManagement
        initialUsers={users.map(({ id, name, email, role, isActive, createdAt, updatedAt }) => ({
          id,
          name,
          email,
          role,
          isActive,
          createdAt,
          updatedAt,
        }))}
        currentPage={currentPage}
        totalUsers={result.total}
        pageSize={USERS_PER_PAGE}
      />
    </div>
  )
}
