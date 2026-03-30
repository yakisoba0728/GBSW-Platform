'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import Sidebar from './Sidebar'
import CreateTab from './CreateTab'
import StudentsTab from './StudentsTab'
import TeachersTab from './TeachersTab'

const ThemeToggle = dynamic(() => import('@/app/components/ThemeToggle'), {
  ssr: false,
  loading: () => <div className="w-9 h-9 rounded-lg" aria-hidden="true" />,
})

export type TabId = 'create' | 'students' | 'teachers'

const TAB_TITLES: Record<TabId, string> = {
  create: '계정 생성',
  students: '학생 관리',
  teachers: '교사 관리',
}

const TABS: TabId[] = ['create', 'students', 'teachers']

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('create')

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/'
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--admin-bg)' }}>
      {/* Sidebar — desktop only */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header */}
        <header
          className="flex items-center justify-between h-14 px-5 md:px-6 sticky top-0 z-10 border-b"
          style={{
            backgroundColor: 'var(--admin-header-bg)',
            borderColor: 'var(--admin-border)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          <span
            className="text-sm font-semibold"
            style={{
              fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              color: 'var(--admin-text)',
            }}
          >
            {TAB_TITLES[activeTab]}
          </span>
          <ThemeToggle />
        </header>

        {/* Mobile tab bar — below header */}
        <div
          className="flex md:hidden border-b overflow-x-auto"
          style={{
            borderColor: 'var(--admin-border)',
            backgroundColor: 'var(--admin-sidebar-bg)',
            scrollbarWidth: 'none',
          }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="relative flex-shrink-0 px-5 py-2.5 text-xs transition-colors duration-150"
                style={{
                  fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                  color: isActive ? 'var(--admin-accent)' : 'var(--admin-text-muted)',
                  fontWeight: isActive ? 600 : 400,
                }}
              >
                {TAB_TITLES[tab]}
                {isActive && (
                  <span
                    className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full"
                    style={{ backgroundColor: 'var(--admin-accent)' }}
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <main className="flex-1 p-5 md:p-8">
          {activeTab === 'create' && <CreateTab />}
          {activeTab === 'students' && <StudentsTab />}
          {activeTab === 'teachers' && <TeachersTab />}
        </main>

      </div>
    </div>
  )
}
