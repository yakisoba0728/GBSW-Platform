'use client'

import DashboardLayout, { type DashboardNavItem } from '@/app/components/DashboardLayout'
import CreateTab from './CreateTab'
import StudentsTab from './StudentsTab'
import TeachersTab from './TeachersTab'

const NAV_ITEMS: DashboardNavItem[] = [
  {
    id: 'create',
    label: '계정 생성',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="16" />
        <line x1="8" y1="12" x2="16" y2="12" />
      </svg>
    ),
  },
  {
    id: 'students',
    label: '학생 관리',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: 'teachers',
    label: '교사 관리',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
        <polyline points="16 11 18 13 22 9" />
      </svg>
    ),
  },
]

export default function AdminDashboard() {
  return (
    <DashboardLayout roleLabel="최고관리자" navItems={NAV_ITEMS} defaultTab="create">
      {(activeTab) => (
        <>
          {activeTab === 'create' && <CreateTab />}
          {activeTab === 'students' && <StudentsTab />}
          {activeTab === 'teachers' && <TeachersTab />}
        </>
      )}
    </DashboardLayout>
  )
}
