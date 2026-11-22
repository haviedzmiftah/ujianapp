import type { ReactNode } from 'react'
import { RoleLayout } from '@/components/layout/RoleLayout'

export default function SiswaLayout({ children }: { children: ReactNode }) {
  return <RoleLayout role="SISWA">{children}</RoleLayout>
}
