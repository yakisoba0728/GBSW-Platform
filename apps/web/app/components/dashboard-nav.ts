import type { ReactNode } from 'react'

export type DashboardNavMatch = 'exact' | 'prefix'

export type DashboardNavChildItem = {
  href: string
  label: string
  match?: DashboardNavMatch
}

export type DashboardNavItem = {
  id: string
  label: string
  icon: ReactNode
  href?: string
  section?: string
  match?: DashboardNavMatch
  children?: DashboardNavChildItem[]
}
