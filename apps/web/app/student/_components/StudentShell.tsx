'use client'

import DashboardShell from '@/app/components/DashboardShell'
import { STUDENT_NAV_ITEMS } from './navigation'

export default function StudentShell({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardShell roleLabel="학생" navItems={STUDENT_NAV_ITEMS}>
      {children}
    </DashboardShell>
  )
}
