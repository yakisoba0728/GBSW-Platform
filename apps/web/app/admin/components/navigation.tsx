import type { DashboardNavItem } from '@/app/components/dashboard-nav'
import {
  DatabaseIcon,
  LockIcon,
  ShieldCheckIcon,
  UsersNavIcon,
} from '@/app/components/ui/icons'

export const ADMIN_NAV_ITEMS: DashboardNavItem[] = [
  {
    id: 'admin-manage',
    label: '교사 관리',
    section: '계정 관리',
    icon: <UsersNavIcon />,
    children: [
      { href: '/admin/teachers/create', label: '교사 생성' },
      { href: '/admin/teachers', label: '교사 목록' },
    ],
  },
  {
    id: 'admin-mileage',
    label: '그린 마일리지',
    section: '마일리지 관리',
    icon: <ShieldCheckIcon />,
    children: [
      { href: '/admin/school/rules', label: '상벌점 항목' },
    ],
  },
  {
    id: 'admin-dorm-mileage',
    label: '기숙사 상벌점',
    icon: <ShieldCheckIcon />,
    children: [
      { href: '/admin/dorm/rules', label: '기숙사 상벌점 항목' },
      { href: '/admin/dorm-mileage/teachers', label: '사감 교사 관리' },
    ],
  },
  {
    id: 'admin-db',
    label: 'DB 관리',
    section: '시스템',
    icon: <DatabaseIcon />,
    children: [{ href: '/admin/db', label: 'DB 관리' }],
  },
  {
    id: 'admin-security',
    label: '보안',
    icon: <LockIcon />,
    children: [{ href: '/admin/security', label: '관리자 보안' }],
  },
]
