'use client'

import DashboardShell from '@/app/components/DashboardShell'
import { buildStudentNavItems } from './navigation'

const SCHOOL_LABELS: Record<'GBSW' | 'BYMS', string> = {
  GBSW: '경북소프트웨어마이스터고등학교',
  BYMS: '봉양중학교',
}

export default function StudentShell({
  school,
  children,
}: {
  school: 'GBSW' | 'BYMS'
  children: React.ReactNode
}) {
  return (
    <DashboardShell
      roleLabel={SCHOOL_LABELS[school]}
      navItems={buildStudentNavItems(school)}
    >
      {children}
    </DashboardShell>
  )
}
