import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { RoleNavigation } from '@/components/layout/RoleNavigation'
import { getSession } from '@/lib/auth/session'
import { ROLE_HOME } from '@/lib/auth/rbac'

export default async function SiswaLayout({ children }: { children: ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'SISWA') redirect(ROLE_HOME[session.role])

  return (
    <div className="min-h-screen bg-gray-50">
      <RoleNavigation role="SISWA" name={session.name} />
      {children}
    </div>
  )
}
