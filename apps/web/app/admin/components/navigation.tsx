import type { DashboardNavItem } from '@/app/components/dashboard-nav'
import {
  ShieldCheckIcon,
  UserCheckIcon,
  UserPlusIcon,
  UsersIcon,
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
    id: 'admin-manage-students',
    label: '학생 관리',
    href: '/admin/students',
    icon: <UsersIcon />,
  },
  {
    id: 'admin-manage-teachers',
    label: '교사 관리',
    href: '/admin/teachers',
    icon: <UserCheckIcon />,
  },
  {
    id: 'admin-mileage',
    label: '그린 마일리지',
    section: '마일리지 관리',
    icon: <ShieldCheckIcon />,
    children: [
      { href: '/admin/mileage/rules', label: '상벌점 항목' },
    ],
  },
]
