'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import LogoutButton from './LogoutButton'

const ThemeToggle = dynamic(() => import('./ThemeToggle'), {
  ssr: false,
  loading: () => <div className="w-9 h-9 rounded-lg" aria-hidden="true" />,
})

export type SubNavItem = {
  id: string
  label: string
}

export type DashboardNavItem = {
  id: string
  label: string
  icon: React.ReactNode
  children?: SubNavItem[]
  section?: string
}

type Props = {
  roleLabel: string
  navItems: DashboardNavItem[]
  defaultTab: string
  children: (activeTab: string) => React.ReactNode
}

/* ── HamburgerIcon: 3선 → X 모프 애니메이션 ── */
function HamburgerIcon({ open }: { open: boolean }) {
  const lineBase: React.CSSProperties = {
    display: 'block',
    position: 'absolute',
    height: '1.5px',
    width: '18px',
    borderRadius: '9999px',
    backgroundColor: 'currentColor',
    transition: 'transform 250ms cubic-bezier(0.16,1,0.3,1), opacity 200ms ease, top 250ms cubic-bezier(0.16,1,0.3,1), bottom 250ms cubic-bezier(0.16,1,0.3,1)',
  }
  return (
    <span
      aria-hidden="true"
      style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 14 }}
    >
      {/* top line */}
      <span style={{
        ...lineBase,
        top: open ? '50%' : 0,
        transform: open ? 'translateY(-50%) rotate(45deg)' : 'none',
      }} />
      {/* middle line */}
      <span style={{
        ...lineBase,
        top: '50%',
        transform: 'translateY(-50%)',
        opacity: open ? 0 : 1,
      }} />
      {/* bottom line */}
      <span style={{
        ...lineBase,
        bottom: open ? '50%' : 0,
        top: 'auto',
        transform: open ? 'translateY(50%) rotate(-45deg)' : 'none',
      }} />
    </span>
  )
}

export default function DashboardLayout({
  roleLabel,
  navItems,
  defaultTab,
  children,
}: Props) {
  const [activeTab, setActiveTab] = useState(defaultTab)

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() =>
    navItems.reduce<Record<string, boolean>>((acc, item) => {
      if (item.children?.some((c) => c.id === defaultTab)) acc[item.id] = true
      return acc
    }, {})
  )

  /* ── Drawer state ── */
  const [drawerOpen, setDrawerOpen] = useState(false)       // DOM 마운트
  const [drawerVisible, setDrawerVisible] = useState(false) // 애니메이션

  /* ── Touch swipe refs ── */
  const touchStartXRef = useRef<number | null>(null)
  const touchStartYRef = useRef<number | null>(null)

  const toggleMenu = useCallback((id: string) => {
    setOpenMenus((prev) => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const activeLabel = (() => {
    for (const item of navItems) {
      if (item.id === activeTab) return item.label
      const sub = item.children?.find((s) => s.id === activeTab)
      if (sub) return sub.label
    }
    return ''
  })()

  /* ── Drawer open/close ── */
  const closeDrawer = useCallback(() => {
    setDrawerVisible(false)
    // transition 완료(220ms) 후 DOM에서 언마운트
    setTimeout(() => setDrawerOpen(false), 260)
  }, [])

  const openDrawer = useCallback(() => {
    setDrawerOpen(true)
    // DOM에 마운트된 뒤 transition이 트리거되도록 한 프레임 대기
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setDrawerVisible(true))
    })
  }, [])

  const handleDrawerNavClick = useCallback((id: string) => {
    setActiveTab(id)
    closeDrawer()
  }, [closeDrawer])

  /* ── body scroll lock + ESC key ── */
  useEffect(() => {
    if (!drawerOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') closeDrawer()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [drawerOpen, closeDrawer])

  /* ── Touch swipe to close ── */
  function handleTouchStart(e: React.TouchEvent) {
    touchStartXRef.current = e.touches[0].clientX
    touchStartYRef.current = e.touches[0].clientY
  }

  function handleTouchMove(e: React.TouchEvent) {
    if (touchStartXRef.current === null) return
    const dx = e.touches[0].clientX - touchStartXRef.current
    const dy = Math.abs(e.touches[0].clientY - (touchStartYRef.current ?? 0))
    if (dx < -30 && dy < Math.abs(dx) / 2) {
      closeDrawer()
      touchStartXRef.current = null
    }
  }

  function handleTouchEnd() {
    touchStartXRef.current = null
    touchStartYRef.current = null
  }

  /* ── 공유 Nav 렌더러 ── */
  function renderNavItems(inDrawer: boolean) {
    return navItems.map((item) => {
      const isActive = activeTab === item.id
      const isOpen = openMenus[item.id] ?? false
      const hasChildren = Boolean(item.children?.length)
      const isChildActive = item.children?.some((c) => c.id === activeTab) ?? false

      return (
        <div key={item.id}>
          {/* 섹션 레이블 */}
          {item.section && (
            <p
              className="px-2 pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-widest select-none"
              style={{
                fontFamily: 'var(--font-space-grotesk)',
                color: 'var(--admin-text-muted)',
                opacity: 0.55,
              }}
            >
              {item.section}
            </p>
          )}

          {/* 메인 메뉴 아이템 */}
          <button
            type="button"
            onClick={() => {
              if (hasChildren) {
                toggleMenu(item.id)
              } else {
                inDrawer ? handleDrawerNavClick(item.id) : setActiveTab(item.id)
              }
            }}
            className="relative w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-all duration-150 hover:bg-black/[0.035] dark:hover:bg-white/[0.04] active:scale-[0.97]"
            style={{
              fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              color: (isActive || isChildActive) ? 'var(--admin-accent)' : 'var(--admin-text-muted)',
              fontWeight: (isActive || isChildActive) ? 500 : 400,
              backgroundColor: isActive ? 'var(--admin-accent-bg)' : 'transparent',
            }}
          >
            {/* 활성 인디케이터 라인 */}
            <span
              className="absolute left-0 rounded-full"
              style={{
                top: '20%',
                bottom: '20%',
                width: isActive ? 2.5 : 0,
                backgroundColor: 'var(--admin-accent)',
                transition: 'width 220ms cubic-bezier(0.16,1,0.3,1)',
              }}
            />

            {/* 아이콘 */}
            <span
              className="flex-shrink-0 transition-colors duration-150"
              style={{
                color: (isActive || isChildActive) ? 'var(--admin-accent)' : 'var(--admin-text-muted)',
                opacity: (isActive || isChildActive) ? 1 : 0.7,
              }}
            >
              {item.icon}
            </span>

            <span className="flex-1 truncate">{item.label}</span>

            {/* 서브메뉴 chevron */}
            {hasChildren && (
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                style={{
                  flexShrink: 0,
                  opacity: 0.45,
                  transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 220ms cubic-bezier(0.16,1,0.3,1)',
                }}
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            )}
          </button>

          {/* 서브메뉴 — CSS grid trick으로 부드러운 height 애니메이션 */}
          {hasChildren && (
            <div
              style={{
                display: 'grid',
                gridTemplateRows: isOpen ? '1fr' : '0fr',
                marginBottom: isOpen ? '4px' : 0,
                transition: 'grid-template-rows 280ms cubic-bezier(0.16,1,0.3,1), margin-bottom 280ms ease',
              }}
            >
              <div style={{ overflow: 'hidden' }}>
                <div className="ml-[22px] pl-3 pt-0.5 pb-1 space-y-px" style={{ borderLeft: '1px solid var(--admin-border)' }}>
                  {item.children?.map((sub, subIdx) => {
                    const isSubActive = activeTab === sub.id
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        tabIndex={isOpen ? 0 : -1}
                        onClick={() =>
                          inDrawer ? handleDrawerNavClick(sub.id) : setActiveTab(sub.id)
                        }
                        className="w-full flex items-center gap-2.5 rounded-lg text-left hover:bg-black/[0.035] dark:hover:bg-white/[0.04] active:scale-[0.97]"
                        style={{
                          fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                          fontSize: '0.8rem',
                          padding: '5px 8px 5px 10px',
                          color: isSubActive ? 'var(--admin-accent)' : 'var(--admin-text-muted)',
                          fontWeight: isSubActive ? 500 : 400,
                          backgroundColor: isSubActive ? 'var(--admin-accent-bg)' : 'transparent',
                          opacity: isOpen ? 1 : 0,
                          transform: isOpen ? 'translateX(0)' : 'translateX(-6px)',
                          transition: 'background 140ms ease, color 140ms ease, opacity 200ms ease, transform 200ms cubic-bezier(0.16,1,0.3,1)',
                          transitionDelay: isOpen ? `${subIdx * 35}ms` : '0ms',
                        }}
                      >
                        <span
                          className="flex-shrink-0 rounded-full"
                          style={{
                            width: isSubActive ? 5 : 3.5,
                            height: isSubActive ? 5 : 3.5,
                            backgroundColor: isSubActive ? 'var(--admin-accent)' : 'var(--admin-text-muted)',
                            opacity: isSubActive ? 1 : 0.38,
                            transition: 'all 180ms ease',
                          }}
                        />
                        {sub.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      )
    })
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--admin-bg)' }}>

      {/* ── Sidebar (desktop only) ── */}
      <aside
        className="hidden md:flex w-[228px] flex-shrink-0 flex-col border-r"
        style={{
          backgroundColor: 'var(--admin-sidebar-bg)',
          borderColor: 'var(--admin-border)',
        }}
      >
        {/* 로고 */}
        <div
          className="flex items-center gap-2.5 px-5 h-14 border-b flex-shrink-0"
          style={{ borderColor: 'var(--admin-border)' }}
        >
          <Image
            src="/gbsw-logo.png"
            alt=""
            width={22}
            height={22}
            aria-hidden="true"
            style={{ opacity: 0.65 }}
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
              {roleLabel}
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2.5 py-3 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          {renderNavItems(false)}
        </nav>

        {/* Logout */}
        <div
          className="px-2.5 py-3 border-t"
          style={{ borderColor: 'var(--admin-border)' }}
        >
          <LogoutButton
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-all duration-150 hover:bg-black/[0.035] dark:hover:bg-white/[0.04]"
            style={{
              fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              color: 'var(--admin-text-muted)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ opacity: 0.55, flexShrink: 0 }}>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            로그아웃
          </LogoutButton>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* ── Header ── */}
        <header
          className="flex items-center justify-between h-14 px-4 md:px-6 sticky top-0 z-20 border-b flex-shrink-0"
          style={{
            backgroundColor: 'var(--admin-header-bg)',
            borderColor: 'var(--admin-border)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
        >
          {/* 모바일: 햄버거 버튼 */}
          <button
            type="button"
            aria-label={drawerVisible ? '메뉴 닫기' : '메뉴 열기'}
            aria-expanded={drawerVisible}
            aria-controls="mobile-drawer"
            onClick={drawerVisible ? closeDrawer : openDrawer}
            className="md:hidden flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg transition-colors duration-150 hover:bg-black/[0.05] dark:hover:bg-white/[0.06]"
            style={{ color: 'var(--admin-text)' }}
          >
            <HamburgerIcon open={drawerVisible} />
          </button>

          {/* 모바일: 중앙 GBSW 로고 */}
          <div
            className="md:hidden absolute left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none select-none"
          >
            <Image
              src="/gbsw-logo.png"
              alt=""
              width={18}
              height={18}
              aria-hidden="true"
              style={{ opacity: 0.6 }}
            />
            <span
              className="text-sm font-semibold"
              style={{
                fontFamily: 'var(--font-space-grotesk)',
                color: 'var(--admin-text)',
              }}
            >
              GBSW
            </span>
          </div>

          {/* 데스크탑: 현재 탭 라벨 */}
          <span
            className="hidden md:block text-sm font-semibold truncate"
            style={{
              fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              color: 'var(--admin-text)',
            }}
          >
            {activeLabel}
          </span>

          <ThemeToggle />
        </header>

        {/* ── Mobile Drawer + Overlay ── */}
        {drawerOpen && (
          <div className="md:hidden">
            {/* 백드롭 오버레이 — CSS transition (keyframe 클래스 스위칭 없음) */}
            <div
              aria-hidden="true"
              onClick={closeDrawer}
              style={{
                position: 'fixed',
                top: 56,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 30,
                backgroundColor: 'rgba(0,0,0,0.45)',
                opacity: drawerVisible ? 1 : 0,
                transition: 'opacity 280ms ease',
              }}
            />

            {/* 드로어 패널 — CSS transition으로 부드럽게 */}
            <aside
              id="mobile-drawer"
              role="navigation"
              aria-label="모바일 메뉴"
              className="flex flex-col"
              style={{
                position: 'fixed',
                top: 56,
                left: 0,
                height: 'calc(100% - 56px)',
                width: 'min(280px, 85vw)',
                zIndex: 40,
                backgroundColor: 'var(--admin-sidebar-bg)',
                borderRight: '1px solid var(--admin-border)',
                willChange: 'transform',
                transform: drawerVisible ? 'translateX(0)' : 'translateX(-100%)',
                transition: drawerVisible
                  ? 'transform 280ms cubic-bezier(0.32,0.72,0,1)'
                  : 'transform 220ms ease-in',
              }}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {/* 드로어 헤더: 로고 + 역할 */}
              <div
                className="flex items-center gap-2.5 px-5 py-4 border-b flex-shrink-0"
                style={{ borderColor: 'var(--admin-border)' }}
              >
                <Image
                  src="/gbsw-logo.png"
                  alt=""
                  width={22}
                  height={22}
                  aria-hidden="true"
                  style={{ opacity: 0.65 }}
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
                    {roleLabel}
                  </p>
                </div>
              </div>

              {/* 드로어 Nav */}
              <nav
                className="flex-1 px-2.5 py-3 overflow-y-auto"
                style={{ scrollbarWidth: 'none' }}
              >
                {renderNavItems(true)}
              </nav>

              {/* 드로어 Footer: 로그아웃 + iOS 안전 영역 */}
              <div
                className="px-2.5 py-3 border-t flex-shrink-0"
                style={{
                  borderColor: 'var(--admin-border)',
                  paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
                }}
              >
                <LogoutButton
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-left transition-all duration-150 hover:bg-black/[0.035] dark:hover:bg-white/[0.04]"
                  style={{
                    fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                    color: 'var(--admin-text-muted)',
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ opacity: 0.55, flexShrink: 0 }}>
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  로그아웃
                </LogoutButton>
              </div>
            </aside>
          </div>
        )}

        {/* ── Content ── */}
        <main className="flex-1 px-5 pt-4 pb-6 md:px-8 md:pt-8 md:pb-8">
          {/* 모바일 전용 페이지 타이틀 — key로 탭 변경 시 재애니메이션 */}
          {activeLabel && (
            <h1
              key={activeLabel}
              className="md:hidden text-base font-semibold mb-5 animate-fade-in"
              style={{
                fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                color: 'var(--admin-text)',
              }}
            >
              {activeLabel}
            </h1>
          )}
          {children(activeTab)}
        </main>

      </div>
    </div>
  )
}
