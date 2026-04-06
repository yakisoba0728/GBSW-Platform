'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import dynamic from 'next/dynamic'
import type { DashboardNavItem, DashboardNavMatch } from './dashboard-nav'
import LogoutButton from './LogoutButton'
import { ChevronRightIcon, LogOutIcon } from './ui/icons'

const ThemeToggle = dynamic(() => import('./ThemeToggle'), {
  ssr: false,
  loading: () => <div className="h-9 w-9 rounded-lg" aria-hidden="true" />,
})

type Props = {
  roleLabel: string
  navItems: DashboardNavItem[]
  children: React.ReactNode
}

function HamburgerIcon({ open }: { open: boolean }) {
  const lineBase: React.CSSProperties = {
    display: 'block',
    position: 'absolute',
    height: '1.5px',
    width: '18px',
    borderRadius: '9999px',
    backgroundColor: 'currentColor',
    transition:
      'transform 250ms cubic-bezier(0.16,1,0.3,1), opacity 200ms ease, top 250ms cubic-bezier(0.16,1,0.3,1), bottom 250ms cubic-bezier(0.16,1,0.3,1)',
  }

  return (
    <span
      aria-hidden="true"
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 18,
        height: 14,
      }}
    >
      <span
        style={{
          ...lineBase,
          top: open ? '50%' : 0,
          transform: open ? 'translateY(-50%) rotate(45deg)' : 'none',
        }}
      />
      <span
        style={{
          ...lineBase,
          top: '50%',
          transform: 'translateY(-50%)',
          opacity: open ? 0 : 1,
        }}
      />
      <span
        style={{
          ...lineBase,
          bottom: open ? '50%' : 0,
          top: 'auto',
          transform: open ? 'translateY(50%) rotate(-45deg)' : 'none',
        }}
      />
    </span>
  )
}

function matchesPath(
  pathname: string,
  href: string,
  match: DashboardNavMatch = 'exact',
) {
  if (match === 'prefix') {
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return pathname === href
}

function hasActiveChild(pathname: string, item: DashboardNavItem) {
  return (
    item.children?.some((child) => matchesPath(pathname, child.href, child.match)) ??
    false
  )
}

function getActiveLabel(pathname: string, navItems: DashboardNavItem[]) {
  for (const item of navItems) {
    if (item.href && matchesPath(pathname, item.href, item.match)) {
      return item.label
    }

    const child = item.children?.find((entry) =>
      matchesPath(pathname, entry.href, entry.match),
    )

    if (child) {
      return child.label
    }
  }

  return ''
}

function getInitialOpenMenus(pathname: string, navItems: DashboardNavItem[]) {
  return navItems.reduce<Record<string, boolean>>((acc, item) => {
    if (hasActiveChild(pathname, item)) {
      acc[item.id] = true
    }

    return acc
  }, {})
}

export default function DashboardShell({
  roleLabel,
  navItems,
  children,
}: Props) {
  const pathname = usePathname()
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>(() =>
    getInitialOpenMenus(pathname, navItems),
  )

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerVisible, setDrawerVisible] = useState(false)
  const touchStartXRef = useRef<number | null>(null)
  const touchStartYRef = useRef<number | null>(null)

  const activeLabel = getActiveLabel(pathname, navItems)

  const closeDrawer = useCallback(() => {
    setDrawerVisible(false)
    setTimeout(() => setDrawerOpen(false), 260)
  }, [])

  const openDrawer = useCallback(() => {
    setDrawerOpen(true)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setDrawerVisible(true))
    })
  }, [])

  const toggleMenu = useCallback((id: string) => {
    setOpenMenus((prev) => ({ ...prev, [id]: !prev[id] }))
  }, [])

  useEffect(() => {
    if (!drawerOpen) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeDrawer()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [closeDrawer, drawerOpen])

  function handleTouchStart(event: React.TouchEvent) {
    touchStartXRef.current = event.touches[0].clientX
    touchStartYRef.current = event.touches[0].clientY
  }

  function handleTouchMove(event: React.TouchEvent) {
    if (touchStartXRef.current === null) {
      return
    }

    const dx = event.touches[0].clientX - touchStartXRef.current
    const dy = Math.abs(event.touches[0].clientY - (touchStartYRef.current ?? 0))

    if (dx < -30 && dy < Math.abs(dx) / 2) {
      closeDrawer()
      touchStartXRef.current = null
    }
  }

  function handleTouchEnd() {
    touchStartXRef.current = null
    touchStartYRef.current = null
  }

  function renderNavItems(inDrawer: boolean) {
    return navItems.map((item) => {
      const isActive = item.href
        ? matchesPath(pathname, item.href, item.match)
        : false
      const isChildActive = hasActiveChild(pathname, item)
      const hasChildren = Boolean(item.children?.length)
      const isOpen = hasChildren
        ? Boolean(openMenus[item.id] || isChildActive)
        : false

      return (
        <div key={item.id}>
          {item.section && (
            <p
              className="select-none overflow-hidden whitespace-nowrap px-2 pb-2 pt-5 text-[11px] font-semibold uppercase tracking-widest"
              style={{
                fontFamily: 'var(--font-space-grotesk)',
                color: 'var(--admin-text-muted)',
                opacity: 0.55,
              }}
            >
              {item.section}
            </p>
          )}

          {hasChildren ? (
            <button
              type="button"
              onClick={() => toggleMenu(item.id)}
              className="relative flex w-full items-center gap-3 rounded-lg px-[14px] py-[10px] text-left text-sm transition-all duration-150 hover:bg-black/[0.035] active:scale-[0.97] dark:hover:bg-white/[0.04]"
              style={{
                fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                color: isChildActive
                  ? 'var(--admin-accent)'
                  : 'var(--admin-text-muted)',
                fontWeight: isChildActive ? 500 : 400,
                backgroundColor: 'transparent',
              }}
            >
              <span
                className="absolute left-0 rounded-full"
                style={{
                  top: '20%',
                  bottom: '20%',
                  width: isChildActive ? 2.5 : 0,
                  backgroundColor: 'var(--admin-accent)',
                  transition: 'width 220ms cubic-bezier(0.16,1,0.3,1)',
                }}
              />

              <span
                className="flex-shrink-0 transition-colors duration-150"
                style={{
                  color: isChildActive
                    ? 'var(--admin-accent)'
                    : 'var(--admin-text-muted)',
                  opacity: isChildActive ? 1 : 0.7,
                }}
              >
                {item.icon}
              </span>

              <span className="flex-1 truncate">{item.label}</span>

              <ChevronRightIcon
                style={{
                  flexShrink: 0,
                  opacity: 0.45,
                  transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                  transition: 'transform 220ms cubic-bezier(0.16,1,0.3,1)',
                }}
              />
            </button>
          ) : (
            <Link
              href={item.href ?? '#'}
              onClick={() => {
                if (inDrawer) {
                  closeDrawer()
                }
              }}
              className="relative flex w-full items-center gap-3 rounded-lg px-[14px] py-[10px] text-left text-sm transition-all duration-150 hover:bg-black/[0.035] active:scale-[0.97] dark:hover:bg-white/[0.04]"
              style={{
                fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                color: isActive
                  ? 'var(--admin-accent)'
                  : 'var(--admin-text-muted)',
                fontWeight: isActive ? 500 : 400,
                backgroundColor: isActive
                  ? 'var(--admin-accent-bg)'
                  : 'transparent',
              }}
            >
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

              <span
                className="flex-shrink-0 transition-colors duration-150"
                style={{
                  color: isActive
                    ? 'var(--admin-accent)'
                    : 'var(--admin-text-muted)',
                  opacity: isActive ? 1 : 0.7,
                }}
              >
                {item.icon}
              </span>

              <span className="flex-1 truncate">{item.label}</span>
            </Link>
          )}

          {hasChildren && (
            <div
              style={{
                display: 'grid',
                gridTemplateRows: isOpen ? '1fr' : '0fr',
                marginBottom: isOpen ? '4px' : 0,
                transition:
                  'grid-template-rows 280ms cubic-bezier(0.16,1,0.3,1), margin-bottom 280ms ease',
              }}
            >
              <div style={{ overflow: 'hidden' }}>
                <div
                  className="ml-[26px] space-y-0.5 border-l pl-3.5 pb-1.5 pt-1"
                  style={{ borderColor: 'var(--admin-border)' }}
                >
                  {item.children?.map((child, index) => {
                    const isChildItemActive = matchesPath(
                      pathname,
                      child.href,
                      child.match,
                    )

                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        tabIndex={isOpen ? 0 : -1}
                        onClick={() => {
                          if (inDrawer) {
                            closeDrawer()
                          }
                        }}
                        className="flex w-full items-center gap-3 rounded-lg px-[12px] py-[7px] text-left text-[0.825rem] hover:bg-black/[0.035] active:scale-[0.97] dark:hover:bg-white/[0.04]"
                        style={{
                          fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                          color: isChildItemActive
                            ? 'var(--admin-accent)'
                            : 'var(--admin-text-muted)',
                          fontWeight: isChildItemActive ? 500 : 400,
                          backgroundColor: isChildItemActive
                            ? 'var(--admin-accent-bg)'
                            : 'transparent',
                          opacity: isOpen ? 1 : 0,
                          transform: isOpen ? 'translateX(0)' : 'translateX(-6px)',
                          transition:
                            'background 140ms ease, color 140ms ease, opacity 200ms ease, transform 200ms cubic-bezier(0.16,1,0.3,1)',
                          transitionDelay: isOpen ? `${index * 35}ms` : '0ms',
                        }}
                      >
                        <span
                          className="flex-shrink-0 rounded-full"
                          style={{
                            width: isChildItemActive ? 5 : 3.5,
                            height: isChildItemActive ? 5 : 3.5,
                            backgroundColor: isChildItemActive
                              ? 'var(--admin-accent)'
                              : 'var(--admin-text-muted)',
                            opacity: isChildItemActive ? 1 : 0.38,
                            transition: 'all 180ms ease',
                          }}
                        />
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
    })
  }

  return (
    <div className="flex h-dvh overflow-hidden" style={{ backgroundColor: 'var(--admin-bg)' }}>
      <aside
        className="hidden flex-shrink-0 flex-col md:flex"
        style={{
          width: 272,
          borderRight: '1px solid var(--admin-border)',
          backgroundColor: 'var(--admin-sidebar-bg)',
        }}
      >
        <div
          className="flex h-16 flex-shrink-0 items-center gap-3 border-b px-5"
          style={{ borderColor: 'var(--admin-border)' }}
        >
          <Image
            src="/gbsw-logo.png"
            alt=""
            width={26}
            height={26}
            aria-hidden="true"
            style={{ opacity: 0.65, flexShrink: 0 }}
          />
          <div className="min-w-0 flex-1">
            <p
              className="text-sm font-semibold leading-tight"
              style={{
                fontFamily: 'var(--font-space-grotesk)',
                color: 'var(--admin-text)',
              }}
            >
              GBSW Platform
            </p>
            <p
              className="mt-0.5 text-[12px]"
              style={{
                fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                color: 'var(--admin-text-muted)',
              }}
            >
              {roleLabel}
            </p>
          </div>
        </div>

        <nav
          className="flex-1 overflow-y-auto px-3 py-3.5"
          style={{ scrollbarWidth: 'none' }}
        >
          {renderNavItems(false)}
        </nav>

        <div
          className="flex-shrink-0 border-t px-3 py-3"
          style={{ borderColor: 'var(--admin-border)' }}
        >
          <LogoutButton
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all duration-150 hover:bg-black/[0.035] dark:hover:bg-white/[0.04]"
            style={{
              fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              color: 'var(--admin-text-muted)',
            }}
          >
            <LogOutIcon style={{ opacity: 0.55, flexShrink: 0 }} />
            로그아웃
          </LogoutButton>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header
          className="sticky top-0 z-20 flex h-16 flex-shrink-0 items-center justify-between border-b px-4 md:px-6"
          style={{
            backgroundColor: 'var(--admin-header-bg)',
            borderColor: 'var(--admin-border)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
        >
          <button
            type="button"
            aria-label={drawerVisible ? '메뉴 닫기' : '메뉴 열기'}
            aria-expanded={drawerVisible}
            aria-controls="mobile-drawer"
            onClick={drawerVisible ? closeDrawer : openDrawer}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg transition-colors duration-150 hover:bg-black/[0.05] md:hidden dark:hover:bg-white/[0.06]"
            style={{ color: 'var(--admin-text)' }}
          >
            <HamburgerIcon open={drawerVisible} />
          </button>

          <div className="pointer-events-none absolute left-1/2 flex -translate-x-1/2 select-none items-center gap-2 md:hidden">
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

          <span
            className="hidden truncate text-sm font-semibold md:block"
            style={{
              fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              color: 'var(--admin-text)',
            }}
          >
            {activeLabel}
          </span>

          <ThemeToggle />
        </header>

        {drawerOpen && (
          <div className="md:hidden">
            <div
              aria-hidden="true"
              onClick={closeDrawer}
              style={{
                position: 'fixed',
                top: 64,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 30,
                backgroundColor: 'rgba(0,0,0,0.45)',
                opacity: drawerVisible ? 1 : 0,
                transition: 'opacity 280ms ease',
              }}
            />

            <aside
              id="mobile-drawer"
              role="navigation"
              aria-label="모바일 메뉴"
              className="flex flex-col"
              style={{
                position: 'fixed',
                top: 64,
                left: 0,
                height: 'calc(100% - 64px)',
                width: 'min(310px, 88vw)',
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
              <div
                className="flex h-16 flex-shrink-0 items-center gap-3 border-b px-5"
                style={{ borderColor: 'var(--admin-border)' }}
              >
                <Image
                  src="/gbsw-logo.png"
                  alt=""
                  width={26}
                  height={26}
                  aria-hidden="true"
                  style={{ opacity: 0.65 }}
                />
                <div>
                  <p
                    className="text-sm font-semibold leading-tight"
                    style={{
                      fontFamily: 'var(--font-space-grotesk)',
                      color: 'var(--admin-text)',
                    }}
                  >
                    GBSW Platform
                  </p>
                  <p
                    className="mt-0.5 text-[12px]"
                    style={{
                      fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                      color: 'var(--admin-text-muted)',
                    }}
                  >
                    {roleLabel}
                  </p>
                </div>
              </div>

              <nav
                className="flex-1 overflow-y-auto px-3 py-3.5"
                style={{ scrollbarWidth: 'none' }}
              >
                {renderNavItems(true)}
              </nav>

              <div
                className="flex-shrink-0 border-t px-3 py-3"
                style={{
                  borderColor: 'var(--admin-border)',
                  paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
                }}
              >
                <LogoutButton
                  className="flex w-full items-center gap-3 rounded-lg px-3.5 py-3 text-left text-sm transition-all duration-150 hover:bg-black/[0.035] dark:hover:bg-white/[0.04]"
                  style={{
                    fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                    color: 'var(--admin-text-muted)',
                  }}
                >
                  <LogOutIcon style={{ opacity: 0.55, flexShrink: 0 }} />
                  로그아웃
                </LogoutButton>
              </div>
            </aside>
          </div>
        )}

        <main className="flex-1 min-h-0 flex flex-col overflow-hidden px-5 pt-4 md:px-8 md:pt-8">
          {activeLabel && (
            <h1
              key={activeLabel}
              className="mb-5 flex-shrink-0 animate-fade-in text-base font-semibold md:hidden"
              style={{
                fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                color: 'var(--admin-text)',
              }}
            >
              {activeLabel}
            </h1>
          )}
          <div className="flex-1 min-h-0 overflow-hidden pb-6 md:pb-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
