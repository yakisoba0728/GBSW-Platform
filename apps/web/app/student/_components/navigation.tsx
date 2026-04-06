import type { DashboardNavItem } from '@/app/components/dashboard-nav'
import { HomeIcon, ShieldCheckIcon } from '@/app/components/ui/icons'

export const STUDENT_NAV_ITEMS: DashboardNavItem[] = [
  {
    id: 'student-home',
    label: '홈',
    href: '/student',
    icon: <HomeIcon />,
  },
  {
    id: 'student-mileage',
    label: '그린 마일리지',
    section: '상벌점',
    icon: <ShieldCheckIcon />,
    children: [
      { href: '/student/mileage/history', label: '상벌점 내역' },
      { href: '/student/mileage/rules', label: '규정 항목' },
      { href: '/student/mileage/stats', label: '내 통계' },
    ],
  },
]
