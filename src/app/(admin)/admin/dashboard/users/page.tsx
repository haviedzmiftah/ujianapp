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
    <Suspense fallback={<p className="p-8 text-gray-500">Memuat daftar pengguna...</p>}>
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
    <main className="mx-auto w-full max-w-6xl p-6 sm:p-8">
      <header className="mb-8">
        <p className="text-sm font-medium text-blue-700">Administrasi</p>
        <h1 className="mt-1 text-2xl font-semibold text-gray-900">Manajemen Pengguna</h1>
        <p className="mt-2 text-sm text-gray-600">
          Buat dan perbarui akun Guru dan Siswa serta kelola status aksesnya.
        </p>
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
    </main>
  )
}
