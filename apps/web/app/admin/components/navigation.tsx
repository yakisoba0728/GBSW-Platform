import type { DashboardNavItem } from '@/app/components/dashboard-nav'
import {
  ShieldCheckIcon,
  UserPlusIcon,
} from '@/app/components/ui/icons'

export const ADMIN_NAV_ITEMS: DashboardNavItem[] = [
  {
    id: 'admin-create',
    label: '계정 생성',
    section: '생성',
    icon: <UserPlusIcon />,
    children: [
      { href: '/admin/students/create', label: '학생 생성' },
      { href: '/admin/teachers/create', label: '교사 생성' },
    ],
  },
  {
    id: 'admin-mileage',
    label: '그린 마일리지',
    section: '마일리지 관리',
    icon: <ShieldCheckIcon />,
    children: [
      { href: '/admin/mileage/rules', label: '상벌점 항목' },
      { href: '/admin/dorm-mileage/rules', label: '기숙사 상벌점 항목' },
      { href: '/admin/dorm-mileage/teachers', label: '사감 교사 관리' },
    ],
  },
]
