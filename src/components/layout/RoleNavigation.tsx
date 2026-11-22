'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logoutAction } from '@/actions/auth.actions'
import type { Role } from '@/types'

const navigationByRole: Record<Role, Array<{ label: string; href: string }>> = {
  ADMIN: [
    { label: 'Dashboard', href: '/admin/dashboard' },
    { label: 'Pengguna', href: '/admin/dashboard/users' },
  ],
  GURU: [
    { label: 'Dashboard', href: '/guru/dashboard' },
    { label: 'Bank Soal', href: '/guru/dashboard/bank-soal' },
    { label: 'Ujian', href: '/guru/dashboard/ujian' },
  ],
  SISWA: [
    { label: 'Dashboard', href: '/siswa/dashboard' },
    { label: 'Ujian', href: '/siswa/dashboard/ujian' },
  ],
}

export function RoleNavigation({ role, name }: { role: Role; name: string }) {
  const pathname = usePathname()
  const links = navigationByRole[role]

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <nav aria-label={`Navigasi ${role}`} className="flex items-center gap-1 overflow-x-auto">
          {links.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>
        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden text-sm text-gray-600 sm:inline">{name}</span>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Keluar
            </button>
          </form>
        </div>
      </div>
    </header>
  )
}
