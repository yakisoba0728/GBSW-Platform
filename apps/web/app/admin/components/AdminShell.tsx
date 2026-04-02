'use client'

import DashboardShell from '@/app/components/DashboardShell'
import { ADMIN_NAV_ITEMS } from './navigation'

export default function AdminShell({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <DashboardShell roleLabel="최고관리자" navItems={ADMIN_NAV_ITEMS}>
      {children}
    </DashboardShell>
  )
}
