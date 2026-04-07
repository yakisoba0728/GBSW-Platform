'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import { AnimatePresence, motion } from 'framer-motion'
import type { DashboardNavItem } from './dashboard-nav'
import {
  getActiveLabel,
  getInitialOpenMenus,
  HamburgerIcon,
  NavSidebar,
} from './dashboard-shell-navigation'
import LogoutButton from './LogoutButton'
import RouteTransition from './ui/RouteTransition'
import { LogOutIcon } from './ui/icons'
import {
  getDrawerMotion,
  getOverlayMotion,
  useMotionPreference,
} from './ui/motion'
import { TopProgressBar } from './ui/progress-bar'
import { acquireBodyScrollLock } from './ui/scroll-lock'
import {
  APP_NAVIGATION_COMPLETE_EVENT,
  APP_NAVIGATION_START_EVENT,
} from '@/lib/url-state'

const ThemeToggle = dynamic(() => import('./ThemeToggle'), {
  ssr: false,
  loading: () => <div style={{ width: 32, height: 32 }} aria-hidden="true" />,
})

type Props = {
  roleLabel: string
  navItems: DashboardNavItem[]
  children: React.ReactNode
}

// ─── DashboardShell ───────────────────────────────────────────────────────────

export default function DashboardShell({ roleLabel, navItems, children }: Props) {
  const pathname = usePathname()
  const prefersReducedMotion = useMotionPreference()
  const overlayMotion = getOverlayMotion(prefersReducedMotion)
  const drawerMotion = getDrawerMotion(prefersReducedMotion)
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() =>
    getInitialOpenMenus(pathname, navItems),
  )
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const locationKey = pathname
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

  useEffect(() => {
    const handleNavigationStart = () => startNavigating()
    const handleNavigationComplete = () => stopNavigating()
    window.addEventListener(APP_NAVIGATION_START_EVENT, handleNavigationStart)
    window.addEventListener(APP_NAVIGATION_COMPLETE_EVENT, handleNavigationComplete)
    return () => {
      window.removeEventListener(APP_NAVIGATION_START_EVENT, handleNavigationStart)
      window.removeEventListener(APP_NAVIGATION_COMPLETE_EVENT, handleNavigationComplete)
    }
  }, [startNavigating, stopNavigating])

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
  const handleNavLinkClick = useCallback(() => {}, [])

  // Escape 키 + body scroll lock
  useEffect(() => {
    if (!drawerOpen) return
    const releaseScrollLock = acquireBodyScrollLock()
    const handle = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDrawer() }
    window.addEventListener('keydown', handle)
    return () => {
      releaseScrollLock()
      window.removeEventListener('keydown', handle)
    }
  }, [drawerOpen, closeDrawer])

  const navFooter = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '4px 8px',
      }}
    >
      <ThemeToggle />
      <LogoutButton
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 10px',
          borderRadius: 8,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 13,
          color: 'var(--fg-muted)',
          transition: 'background-color 0.15s ease',
        }}
      >
        <LogOutIcon style={{ opacity: 0.5, flexShrink: 0, width: 15, height: 15 }} />
        로그아웃
      </LogoutButton>
    </div>
  )

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
        <NavSidebar {...navProps} inDrawer={false} footer={navFooter} />
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
                initial={overlayMotion.initial}
                animate={overlayMotion.animate}
                exit={overlayMotion.exit}
                transition={overlayMotion.transition}
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
                initial={drawerMotion.initial}
                animate={drawerMotion.animate}
                exit={drawerMotion.exit}
                transition={drawerMotion.transition}
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
                <NavSidebar {...navProps} inDrawer={true} footer={navFooter} />
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
            <AnimatePresence mode="wait" initial={false}>
              <RouteTransition key={locationKey} style={{ height: '100%' }}>
                {children}
              </RouteTransition>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  )
}
