import { Suspense, type ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { ROLE_HOME } from '@/lib/auth/rbac'
import type { Role } from '@/types'
import { RoleNavigation } from './RoleNavigation'

interface RoleLayoutProps {
  role: Role
  children: ReactNode
}

export function RoleLayout({ role, children }: RoleLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Suspense fallback={<NavigationFallback />}>
        <AuthenticatedNavigation role={role} />
      </Suspense>
      {children}
    </div>
  )
}

async function AuthenticatedNavigation({ role }: { role: Role }) {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== role) redirect(ROLE_HOME[session.role])
  return <RoleNavigation role={role} name={session.name} />
}

function NavigationFallback() {
  return (
    <div
      aria-hidden="true"
      className="h-[57px] border-b border-gray-200 bg-white"
    />
  )
}
