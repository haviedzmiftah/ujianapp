import { Suspense, type ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { ROLE_HOME } from '@/lib/auth/rbac'
import { AdminShell } from '@/components/admin/AdminShell'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center p-8 text-slate-500 font-medium">Memuat Antarmuka Admin...</div>}>
      <AdminAuthWrapper>{children}</AdminAuthWrapper>
    </Suspense>
  )
}

async function AdminAuthWrapper({ children }: { children: ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'ADMIN') redirect(ROLE_HOME[session.role])

  return (
    <AdminShell adminName={session.name} adminEmail={session.email}>
      {children}
    </AdminShell>
  )
}
