import type { DashboardNavItem } from '@/app/components/dashboard-nav'
import { BuildingIcon, HomeIcon, ShieldCheckIcon } from '@/app/components/ui/icons'

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
  {
    id: 'student-dorm-mileage',
    label: '기숙사 상벌점',
    section: '상벌점',
    icon: <BuildingIcon size={15} />,
    children: [
      { href: '/student/dorm-mileage/history', label: '상벌점 내역' },
      { href: '/student/dorm-mileage/rules', label: '규정 항목' },
      { href: '/student/dorm-mileage/stats', label: '내 통계' },
    ],
  },
]
