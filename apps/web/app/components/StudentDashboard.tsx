'use client'

import DashboardLayout, { type DashboardNavItem } from './DashboardLayout'

const NAV_ITEMS: DashboardNavItem[] = [
  {
    id: 'home',
    label: '홈',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
]

export default function StudentDashboard() {
  return (
    <DashboardLayout roleLabel="학생" navItems={NAV_ITEMS} defaultTab="home">
      {(activeTab) => (
        <>
          {activeTab === 'home' && (
            <div
              className="text-sm"
              style={{
                fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                color: 'var(--admin-text-muted)',
              }}
            >
              학생 홈 콘텐츠가 들어올 자리입니다.
            </div>
          )}
        </>
      )}
    </DashboardLayout>
  )
}
