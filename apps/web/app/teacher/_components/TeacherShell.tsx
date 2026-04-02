'use client'

import DashboardShell from '@/app/components/DashboardShell'
import { TEACHER_NAV_ITEMS } from './navigation'

export default function TeacherShell({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardShell roleLabel="교사" navItems={TEACHER_NAV_ITEMS}>
      {children}
    </DashboardShell>
  )
}
