import type { DashboardNavItem } from '@/app/components/dashboard-nav'
import { HomeIcon, ShieldCheckIcon, UsersNavIcon } from '@/app/components/ui/icons'

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
      { href: '/teacher/school/grant', label: '상벌점 부여' },
      { href: '/teacher/school/history', label: '상벌점 내역' },
      { href: '/teacher/school/students', label: '학생별 조회' },
      { href: '/teacher/school/stats', label: '통계 보기' },
      { href: '/teacher/school/classes', label: '학급별 현황' },
      { href: '/teacher/school/rules', label: '상벌점 항목' },
      { href: '/teacher/school/report', label: '보고서 출력' },
    ],
  },
  {
    id: 'teacher-students',
    label: '학생 관리',
    section: '학생 관리',
    icon: <UsersNavIcon />,
    children: [
      { href: '/teacher/students', label: '학생 목록' },
    ],
  },
  {
    id: 'teacher-dorm-mileage',
    label: '기숙사 상벌점',
    icon: <ShieldCheckIcon />,
    children: [
      { href: '/teacher/dorm/grant', label: '기숙사 상벌점 부여' },
      { href: '/teacher/dorm/history', label: '기숙사 상벌점 내역' },
      { href: '/teacher/dorm/students', label: '기숙사 학생별 조회' },
      { href: '/teacher/dorm/stats', label: '기숙사 통계 보기' },
      { href: '/teacher/dorm/classes', label: '기숙사 학급별 현황' },
      { href: '/teacher/dorm/rules', label: '기숙사 상벌점 항목' },
      { href: '/teacher/dorm/report', label: '기숙사 보고서 출력' },
    ],
  },
]
