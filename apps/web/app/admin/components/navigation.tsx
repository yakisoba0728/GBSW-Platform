import type { DashboardNavItem } from '@/app/components/dashboard-nav'
import {
  LockIcon,
  ShieldCheckIcon,
  UserPlusNavIcon,
  UsersNavIcon,
} from '@/app/components/ui/icons'

export const ADMIN_NAV_ITEMS: DashboardNavItem[] = [
  {
    id: 'admin-create',
    label: '계정 생성',
    section: '생성',
    icon: <UserPlusNavIcon />,
    children: [
      { href: '/admin/students/create', label: '학생 생성' },
      { href: '/admin/teachers/create', label: '교사 생성' },
    ],
  },
  {
    id: 'admin-manage',
    label: '계정 관리',
    section: '운영',
    icon: <UsersNavIcon />,
    children: [
      { href: '/admin/students', label: '학생 관리' },
      { href: '/admin/teachers', label: '교사 관리' },
    ],
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
  {
    id: 'admin-dorm-mileage',
    label: '기숙사 상벌점',
    icon: <ShieldCheckIcon />,
    children: [
      { href: '/admin/dorm-mileage/rules', label: '기숙사 상벌점 항목' },
      { href: '/admin/dorm-mileage/teachers', label: '사감 교사 관리' },
    ],
  },
  {
    id: 'admin-security',
    label: '보안',
    section: '운영',
    icon: <LockIcon />,
    children: [{ href: '/admin/security', label: '관리자 보안' }],
  },
]
