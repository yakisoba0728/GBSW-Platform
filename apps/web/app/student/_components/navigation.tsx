import type { DashboardNavItem } from '@/app/components/dashboard-nav'
import { HomeIcon } from '@/app/components/ui/icons'

export const STUDENT_NAV_ITEMS: DashboardNavItem[] = [
  {
    id: 'student-home',
    label: '홈',
    href: '/student',
    icon: <HomeIcon />,
  },
]
