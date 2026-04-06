'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { AnimatePresence, motion } from 'framer-motion'
import type { DashboardNavItem, DashboardNavMatch } from './dashboard-nav'
import LogoutButton from './LogoutButton'
import { ChevronRightIcon, LogOutIcon } from './ui/icons'
import { TopProgressBar } from './ui/progress-bar'
import { DASHBOARD_NAVIGATION_START_EVENT } from '@/lib/url-state'

const ThemeToggle = dynamic(() => import('./ThemeToggle'), {
  ssr: false,
  loading: () => <div style={{ width: 32, height: 32 }} aria-hidden="true" />,
})

type Props = {
  roleLabel: string
  navItems: DashboardNavItem[]
  children: React.ReactNode
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function matchesPath(pathname: string, href: string, match: DashboardNavMatch = 'exact') {
  if (match === 'prefix') return pathname === href || pathname.startsWith(`${href}/`)
  return pathname === href
}

function hasActiveChild(pathname: string, item: DashboardNavItem) {
  return item.children?.some((child) => matchesPath(pathname, child.href, child.match)) ?? false
}

function getActiveLabel(pathname: string, navItems: DashboardNavItem[]) {
  for (const item of navItems) {
    if (item.href && matchesPath(pathname, item.href, item.match)) return item.label
    const child = item.children?.find((entry) => matchesPath(pathname, entry.href, entry.match))
    if (child) return child.label
  }
  return ''
}

function getInitialOpenMenus(pathname: string, navItems: DashboardNavItem[]) {
  return navItems.reduce<Record<string, boolean>>((acc, item) => {
    if (hasActiveChild(pathname, item)) acc[item.id] = true
    return acc
  }, {})
}

// ─── HamburgerIcon ────────────────────────────────────────────────────────────

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <motion.span
      aria-hidden="true"
      style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 18, height: 14 }}
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={
            open
              ? i === 0
                ? { top: '50%', rotate: 45, translateY: '-50%' }
                : i === 1
                  ? { opacity: 0 }
                  : { bottom: '50%', rotate: -45, translateY: '50%', top: 'auto' }
              : i === 0
                ? { top: 0, rotate: 0, translateY: 0 }
                : i === 1
                  ? { opacity: 1 }
                  : { bottom: 0, rotate: 0, translateY: 0, top: 'auto' }
          }
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          style={{
            display: 'block',
            position: 'absolute',
            height: '1.5px',
            width: '18px',
            borderRadius: 9999,
            backgroundColor: 'currentColor',
            ...(i === 0 ? { top: 0 } : i === 1 ? { top: '50%', transform: 'translateY(-50%)' } : { bottom: 0 }),
          }}
        />
      ))}
    </motion.span>
  )
}

// ─── NavSidebar ───────────────────────────────────────────────────────────────

function NavSidebar({
  roleLabel,
  navItems,
  pathname,
  openMenus,
  toggleMenu,
  onNavLinkClick,
  inDrawer,
  closeDrawer,
}: {
  roleLabel: string
  navItems: DashboardNavItem[]
  pathname: string
  openMenus: Record<string, boolean>
  toggleMenu: (id: string) => void
  onNavLinkClick: (href: string) => void
  inDrawer: boolean
  closeDrawer: () => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* 로고 + 역할 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', height: 52, flexShrink: 0, borderBottom: '1px solid var(--border)' }}>
        <Image src="/gbsw-logo.png" alt="" width={22} height={22} aria-hidden="true" style={{ opacity: 0.55, flexShrink: 0 }} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)', lineHeight: 1.3, letterSpacing: '-0.01em' }}>
            GBSW Platform
          </p>
          <p style={{ fontSize: 11, color: 'var(--fg-muted)', lineHeight: 1.3 }}>
            {roleLabel}
          </p>
        </div>
      </div>

      {/* 네비게이션 */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 8px', scrollbarWidth: 'none' }}>
        {navItems.map((item) => {
          const isActive = item.href ? matchesPath(pathname, item.href, item.match) : false
          const isChildActive = hasActiveChild(pathname, item)
          const hasChildren = Boolean(item.children?.length)
          const isOpen = hasChildren ? Boolean(openMenus[item.id] || isChildActive) : false

          return (
            <div key={item.id}>
              {item.section && (
                <p style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
                  color: 'var(--fg-muted)', opacity: 0.5,
                  padding: '16px 8px 6px 8px', userSelect: 'none',
                }}>
                  {item.section}
                </p>
              )}

              {hasChildren ? (
                <motion.button
                  type="button"
                  onClick={() => toggleMenu(item.id)}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    display: 'flex', width: '100%', alignItems: 'center', gap: 9,
                    padding: '7px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', textAlign: 'left',
                    fontSize: 13, fontWeight: isChildActive ? 500 : 400,
                    color: isChildActive ? 'var(--accent)' : 'var(--fg-muted)',
                    backgroundColor: isChildActive ? 'var(--accent-subtle)' : 'transparent',
                    borderLeft: isChildActive ? '2px solid var(--accent)' : '2px solid transparent',
                    transition: 'background-color 0.15s ease, color 0.15s ease',
                  }}
                >
                  <span style={{ flexShrink: 0, color: isChildActive ? 'var(--accent)' : 'var(--fg-muted)', opacity: isChildActive ? 1 : 0.55 }}>
                    {item.icon}
                  </span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
                  <motion.span
                    animate={{ rotate: isOpen ? 90 : 0 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    style={{ flexShrink: 0, opacity: 0.35 }}
                  >
                    <ChevronRightIcon style={{ width: 13, height: 13 }} />
                  </motion.span>
                </motion.button>
              ) : (
                <Link
                  href={item.href ?? '#'}
                  onClick={() => {
                    if (item.href) onNavLinkClick(item.href)
                    if (inDrawer) closeDrawer()
                  }}
                  style={{
                    display: 'flex', width: '100%', alignItems: 'center', gap: 9,
                    padding: '7px 10px', borderRadius: 8, textDecoration: 'none',
                    fontSize: 13, fontWeight: isActive ? 500 : 400,
                    color: isActive ? 'var(--accent)' : 'var(--fg-muted)',
                    backgroundColor: isActive ? 'var(--accent-subtle)' : 'transparent',
                    borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                    transition: 'background-color 0.15s ease, color 0.15s ease',
                  }}
                >
                  <span style={{ flexShrink: 0, color: isActive ? 'var(--accent)' : 'var(--fg-muted)', opacity: isActive ? 1 : 0.55 }}>
                    {item.icon}
                  </span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
                </Link>
              )}

              {/* 서브메뉴 (collapse/expand) */}
              {hasChildren && (
                <div style={{
                  display: 'grid',
                  gridTemplateRows: isOpen ? '1fr' : '0fr',
                  marginBottom: isOpen ? 2 : 0,
                  transition: 'grid-template-rows 240ms cubic-bezier(0.16,1,0.3,1), margin-bottom 240ms ease',
                }}>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ marginLeft: 22, borderLeft: '1px solid var(--border)', padding: '4px 0 4px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {item.children?.map((child, idx) => {
                        const isChildItemActive = matchesPath(pathname, child.href, child.match)
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            tabIndex={isOpen ? 0 : -1}
                            onClick={() => {
                              onNavLinkClick(child.href)
                              if (inDrawer) closeDrawer()
                            }}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              padding: '6px 10px', borderRadius: 6, textDecoration: 'none',
                              fontSize: 12.5, fontWeight: isChildItemActive ? 500 : 400,
                              color: isChildItemActive ? 'var(--accent)' : 'var(--fg-muted)',
                              backgroundColor: isChildItemActive ? 'var(--accent-subtle)' : 'transparent',
                              opacity: isOpen ? 1 : 0,
                              transform: isOpen ? 'translateX(0)' : 'translateX(-4px)',
                              transition: `background-color 0.12s ease, color 0.12s ease, opacity 0.18s ease ${idx * 25}ms, transform 0.18s cubic-bezier(0.16,1,0.3,1) ${idx * 25}ms`,
                            }}
                          >
                            <span style={{
                              width: isChildItemActive ? 5 : 3.5, height: isChildItemActive ? 5 : 3.5,
                              borderRadius: '50%', flexShrink: 0,
                              backgroundColor: isChildItemActive ? 'var(--accent)' : 'var(--fg-muted)',
                              opacity: isChildItemActive ? 1 : 0.35,
                              transition: 'all 0.16s ease',
                            }} />
                            {child.label}
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {/* 하단 영역: 다크모드 + 로그아웃 */}
      <div style={{ flexShrink: 0, borderTop: '1px solid var(--border)', padding: '8px', paddingBottom: inDrawer ? 'max(8px, env(safe-area-inset-bottom))' : 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px' }}>
          <ThemeToggle />
          <LogoutButton
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--fg-muted)', transition: 'background-color 0.15s ease' }}
          >
            <LogOutIcon style={{ opacity: 0.5, flexShrink: 0, width: 15, height: 15 }} />
            로그아웃
          </LogoutButton>
        </div>
      </div>
    </div>
  )
}

// ─── DashboardShell ───────────────────────────────────────────────────────────

export default function DashboardShell({ roleLabel, navItems, children }: Props) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchQuery = searchParams.toString()
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() =>
    getInitialOpenMenus(pathname, navItems),
  )
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const locationKey = searchQuery ? `${pathname}?${searchQuery}` : pathname
  const prevLocationKey = useRef(locationKey)
  const navigationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const activeLabel = getActiveLabel(pathname, navItems)

  const stopNavigating = useCallback(() => {
    if (navigationTimeoutRef.current !== null) {
      clearTimeout(navigationTimeoutRef.current)
      navigationTimeoutRef.current = null
    }
    setIsNavigating(false)
  }, [])

  const startNavigating = useCallback(() => {
    if (navigationTimeoutRef.current !== null) {
      clearTimeout(navigationTimeoutRef.current)
    }
    setIsNavigating(true)
    navigationTimeoutRef.current = setTimeout(() => {
      navigationTimeoutRef.current = null
      setIsNavigating(false)
    }, 10000)
  }, [])

  // 실제 URL 반영 시점에 progress bar 종료
  useEffect(() => {
    if (prevLocationKey.current !== locationKey) {
      prevLocationKey.current = locationKey
      const frameId = window.requestAnimationFrame(stopNavigating)
      return () => window.cancelAnimationFrame(frameId)
    }
  }, [locationKey, stopNavigating])

  // 쿼리스트링 기반 이동은 공통 이벤트에서 시작
  useEffect(() => {
    const handleNavigationStart = () => startNavigating()
    window.addEventListener(DASHBOARD_NAVIGATION_START_EVENT, handleNavigationStart)
    return () => {
      window.removeEventListener(DASHBOARD_NAVIGATION_START_EVENT, handleNavigationStart)
    }
  }, [startNavigating])

  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current !== null) {
        clearTimeout(navigationTimeoutRef.current)
      }
    }
  }, [])

  const closeDrawer = useCallback(() => setDrawerOpen(false), [])
  const openDrawer = useCallback(() => setDrawerOpen(true), [])
  const toggleMenu = useCallback((id: string) => {
    setOpenMenus((prev) => ({ ...prev, [id]: !prev[id] }))
  }, [])
  const handleNavLinkClick = useCallback((href: string) => {
    const isSamePath = pathname === href
    const hasQuery = searchQuery.length > 0

    if (!isSamePath || hasQuery) {
      startNavigating()
    }
  }, [pathname, searchQuery, startNavigating])

  // Escape 키 + body scroll lock
  useEffect(() => {
    if (!drawerOpen) return
    document.body.style.overflow = 'hidden'
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDrawer() }
    window.addEventListener('keydown', handle)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handle)
    }
  }, [drawerOpen, closeDrawer])

  const navProps = { roleLabel, navItems, pathname, openMenus, toggleMenu, onNavLinkClick: handleNavLinkClick, closeDrawer }

  return (
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', backgroundColor: 'var(--bg)' }}>
      {/* TopProgressBar */}
      <TopProgressBar active={isNavigating} />

      {/* PC 사이드바 (≥1024px) */}
      <aside
        className="hidden lg:flex"
        style={{
          width: 'var(--sidebar-width)',
          flexShrink: 0,
          flexDirection: 'column',
          borderRight: '1px solid var(--border)',
          backgroundColor: 'var(--bg-subtle)',
          height: '100vh',
        }}
      >
        <NavSidebar {...navProps} inDrawer={false} />
      </aside>

      {/* 우측 영역 */}
      <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, overflow: 'hidden' }}>
        {/* PC 헤더 */}
        <header
          className="hidden lg:flex"
          style={{
            height: 'var(--header-height)',
            flexShrink: 0,
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            borderBottom: '1px solid var(--border)',
            backgroundColor: 'var(--admin-header-bg)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            position: 'sticky',
            top: 0,
            zIndex: 20,
          }}
        >
          <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--fg)', letterSpacing: '-0.02em' }}>
            {activeLabel}
          </h1>
        </header>

        {/* 모바일 헤더 (<1024px) */}
        <header
          className="flex lg:hidden"
          style={{
            height: 'var(--header-height)',
            flexShrink: 0,
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px',
            borderBottom: '1px solid var(--border)',
            backgroundColor: 'var(--admin-header-bg)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            position: 'sticky',
            top: 0,
            zIndex: 20,
          }}
        >
          <button
            type="button"
            aria-label={drawerOpen ? '메뉴 닫기' : '메뉴 열기'}
            aria-expanded={drawerOpen}
            aria-controls="mobile-drawer"
            onClick={drawerOpen ? closeDrawer : openDrawer}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 36, height: 36, borderRadius: 8, border: 'none', background: 'none',
              cursor: 'pointer', color: 'var(--fg)',
            }}
          >
            <HamburgerIcon open={drawerOpen} />
          </button>

          {/* 중앙 타이틀 */}
          <span style={{
            position: 'absolute', left: '50%', transform: 'translateX(-50%)',
            fontSize: 14, fontWeight: 600, color: 'var(--fg)',
            maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            pointerEvents: 'none', userSelect: 'none',
          }}>
            {activeLabel || 'GBSW Platform'}
          </span>

          <ThemeToggle />
        </header>

        {/* 모바일 드로어 + 오버레이 */}
        <AnimatePresence>
          {drawerOpen && (
            <>
              {/* 오버레이 */}
              <motion.div
                key="overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={closeDrawer}
                aria-hidden="true"
                style={{
                  position: 'fixed', inset: 0,
                  top: 'var(--header-height)',
                  zIndex: 30,
                  backgroundColor: 'rgba(0,0,0,0.4)',
                  backdropFilter: 'blur(2px)',
                }}
              />

              {/* 드로어 패널 */}
              <motion.aside
                key="drawer"
                id="mobile-drawer"
                role="navigation"
                aria-label="모바일 메뉴"
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                drag="x"
                dragConstraints={{ left: -280, right: 0 }}
                dragElastic={0.1}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -60) closeDrawer()
                }}
                style={{
                  position: 'fixed',
                  top: 'var(--header-height)',
                  left: 0,
                  height: 'calc(100% - var(--header-height))',
                  width: 'min(280px, 85vw)',
                  zIndex: 40,
                  backgroundColor: 'var(--bg-subtle)',
                  borderRight: '1px solid var(--border)',
                  boxShadow: '4px 0 24px rgba(0,0,0,0.08)',
                  touchAction: 'pan-y',
                }}
              >
                <NavSidebar {...navProps} inDrawer={true} />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* 메인 콘텐츠 */}
        <main className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div
            className="flex-1 min-h-0 overflow-auto px-4 py-4 pb-6 lg:px-6 lg:py-6"
            style={{ maxWidth: 1280, width: '100%', margin: '0 auto' }}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
