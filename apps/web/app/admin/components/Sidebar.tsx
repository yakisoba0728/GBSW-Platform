import Image from 'next/image'
import LogoutButton from '@/app/components/LogoutButton'
import type { TabId } from './AdminDashboard'

interface Props {
  activeTab: TabId
  onTabChange: (tab: TabId) => void
}

const NAV_ITEMS: { id: TabId; label: string; icon: React.ReactNode }[] = [
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

export default function Sidebar({ activeTab, onTabChange }: Props) {
  return (
    <aside
      className="hidden md:flex w-[220px] flex-shrink-0 flex-col border-r"
      style={{
        backgroundColor: 'var(--admin-sidebar-bg)',
        borderColor: 'var(--admin-border)',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-start gap-2.5 px-5 py-4 border-b"
        style={{ borderColor: 'var(--admin-border)' }}
      >
        <Image
          src="/gbsw-logo.png"
          alt=""
          width={22}
          height={22}
          aria-hidden="true"
          style={{ opacity: 0.65, marginTop: 1 }}
        />
        <div>
          <p
            className="text-xs font-semibold leading-tight"
            style={{
              fontFamily: 'var(--font-space-grotesk)',
              color: 'var(--admin-text)',
            }}
          >
            GBSW Platform
          </p>
          <p
            className="text-[11px] mt-0.5"
            style={{
              fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              color: 'var(--admin-text-muted)',
            }}
          >
            최고관리자
          </p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-3 space-y-px">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-colors duration-150"
              style={{
                fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                color: isActive ? 'var(--admin-accent)' : 'var(--admin-text-muted)',
                fontWeight: isActive ? 500 : 400,
                backgroundColor: isActive ? 'var(--admin-accent-bg)' : 'transparent',
              }}
            >
              {item.icon}
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Logout */}
      <div
        className="px-2.5 py-3 border-t"
        style={{ borderColor: 'var(--admin-border)' }}
      >
        <LogoutButton
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-colors duration-150 hover:bg-black/[0.04] dark:hover:bg-white/[0.04]"
          style={{
            fontFamily: 'var(--font-noto-sans-kr), sans-serif',
            color: 'var(--admin-text-muted)',
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          로그아웃
        </LogoutButton>
      </div>
    </aside>
  )
}
