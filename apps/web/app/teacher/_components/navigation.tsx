import type { DashboardNavItem } from '@/app/components/dashboard-nav'
import { HomeIcon, ShieldCheckIcon } from '@/app/components/ui/icons'

export const TEACHER_NAV_ITEMS: DashboardNavItem[] = [
  {
    id: 'teacher-home',
    label: '홈',
    href: '/teacher',
    icon: <HomeIcon />,
  },
  {
    id: 'teacher-mileage',
    label: '그린 마일리지',
    section: '학생 관리',
    icon: <ShieldCheckIcon />,
    children: [
      { href: '/teacher/mileage/grant', label: '상벌점 부여' },
      { href: '/teacher/mileage/history', label: '상벌점 내역' },
      { href: '/teacher/mileage/students', label: '학생별 조회' },
      { href: '/teacher/mileage/stats', label: '통계 보기' },
      { href: '/teacher/mileage/classes', label: '학급별 현황' },
      { href: '/teacher/mileage/rules', label: '상벌점 항목' },
      { href: '/teacher/mileage/report', label: '보고서 출력' },
    ],
  },
  {
    id: 'teacher-dorm-mileage',
    label: '기숙사 상벌점',
    icon: <ShieldCheckIcon />,
    children: [
      { href: '/teacher/dorm-mileage/grant', label: '기숙사 상벌점 부여' },
      { href: '/teacher/dorm-mileage/history', label: '기숙사 상벌점 내역' },
      { href: '/teacher/dorm-mileage/students', label: '기숙사 학생별 조회' },
      { href: '/teacher/dorm-mileage/stats', label: '기숙사 통계 보기' },
      { href: '/teacher/dorm-mileage/classes', label: '기숙사 학급별 현황' },
      { href: '/teacher/dorm-mileage/rules', label: '기숙사 상벌점 항목' },
      { href: '/teacher/dorm-mileage/report', label: '기숙사 보고서 출력' },
    ],
  },
]
