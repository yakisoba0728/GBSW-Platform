'use client'

import type { ReactNode } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import type { DashboardNavItem, DashboardNavMatch } from './dashboard-nav'
import { ChevronRightIcon } from './ui/icons'
import {
  getAccordionTransitionCss,
  getMicroInteractionTransition,
  useMotionPreference,
} from './ui/motion'

export function matchesPath(
  pathname: string,
  href: string,
  match: DashboardNavMatch = 'exact',
) {
  if (match === 'prefix') {
    return pathname === href || pathname.startsWith(`${href}/`)
  }

  return pathname === href
}

export function hasActiveChild(pathname: string, item: DashboardNavItem) {
  return (
    item.children?.some((child) => matchesPath(pathname, child.href, child.match)) ??
    false
  )
}

export function getActiveLabel(pathname: string, navItems: DashboardNavItem[]) {
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

export function getInitialOpenMenus(
  pathname: string,
  navItems: DashboardNavItem[],
) {
  return navItems.reduce<Record<string, boolean>>((acc, item) => {
    if (hasActiveChild(pathname, item)) {
      acc[item.id] = true
    }

    return acc
  }, {})
}

export function HamburgerIcon({ open }: { open: boolean }) {
  const prefersReducedMotion = useMotionPreference()
  const transition = getMicroInteractionTransition(prefersReducedMotion)

  return (
    <motion.span
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
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={
            open
              ? i === 0
                ? { top: '50%', rotate: 45, translateY: '-50%' }
                : i === 1
                  ? { opacity: 0 }
                  : {
                      bottom: '50%',
                      rotate: -45,
                      translateY: '50%',
                      top: 'auto',
                    }
              : i === 0
                ? { top: 0, rotate: 0, translateY: 0 }
                : i === 1
                  ? { opacity: 1 }
                  : { bottom: 0, rotate: 0, translateY: 0, top: 'auto' }
          }
          transition={transition}
          style={{
            display: 'block',
            position: 'absolute',
            height: '1.5px',
            width: '18px',
            borderRadius: 9999,
            backgroundColor: 'currentColor',
            ...(i === 0
              ? { top: 0 }
              : i === 1
                ? { top: '50%', transform: 'translateY(-50%)' }
                : { bottom: 0 }),
          }}
        />
      ))}
    </motion.span>
  )
}

export function NavSidebar({
  roleLabel,
  navItems,
  pathname,
  openMenus,
  toggleMenu,
  onNavLinkClick,
  inDrawer,
  closeDrawer,
  footer,
}: {
  roleLabel: string
  navItems: DashboardNavItem[]
  pathname: string
  openMenus: Record<string, boolean>
  toggleMenu: (id: string) => void
  onNavLinkClick: (href: string) => void
  inDrawer: boolean
  closeDrawer: () => void
  footer: ReactNode
}) {
  const prefersReducedMotion = useMotionPreference()
  const microTransition = getMicroInteractionTransition(prefersReducedMotion)
  const accordionTransition = getAccordionTransitionCss(prefersReducedMotion)

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 16px',
          height: 52,
          flexShrink: 0,
          borderBottom: '1px solid var(--border)',
        }}
      >
        <Image
          src="/gbsw-logo.png"
          alt=""
          width={22}
          height={22}
          aria-hidden="true"
          style={{ opacity: 0.55, flexShrink: 0 }}
        />
        <div style={{ minWidth: 0, flex: 1 }}>
          <p
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--fg)',
              lineHeight: 1.3,
              letterSpacing: '-0.01em',
            }}
          >
            GBSW Platform
          </p>
          <p style={{ fontSize: 11, color: 'var(--fg-muted)', lineHeight: 1.3 }}>
            {roleLabel}
          </p>
        </div>
      </div>

      <nav
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '10px 8px',
          scrollbarWidth: 'none',
        }}
      >
        {navItems.map((item) => {
          const isActive = item.href ? matchesPath(pathname, item.href, item.match) : false
          const isChildActive = hasActiveChild(pathname, item)
          const hasChildren = Boolean(item.children?.length)
          const isOpen = hasChildren ? Boolean(openMenus[item.id] || isChildActive) : false

          return (
            <div key={item.id}>
              {item.section && (
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: 'var(--fg-muted)',
                    opacity: 0.5,
                    padding: '16px 8px 6px 8px',
                    userSelect: 'none',
                  }}
                >
                  {item.section}
                </p>
              )}

              {hasChildren ? (
                <motion.button
                  type="button"
                  onClick={() => toggleMenu(item.id)}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    display: 'flex',
                    width: '100%',
                    alignItems: 'center',
                    gap: 9,
                    padding: '7px 10px',
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontSize: 13,
                    fontWeight: isChildActive ? 500 : 400,
                    color: isChildActive ? 'var(--accent)' : 'var(--fg-muted)',
                    backgroundColor: isChildActive
                      ? 'var(--accent-subtle)'
                      : 'transparent',
                    borderLeft: isChildActive
                      ? '2px solid var(--accent)'
                      : '2px solid transparent',
                    transition: 'background-color 0.15s ease, color 0.15s ease',
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      color: isChildActive ? 'var(--accent)' : 'var(--fg-muted)',
                      opacity: isChildActive ? 1 : 0.55,
                    }}
                  >
                    {item.icon}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.label}
                  </span>
                  <motion.span
                    animate={{ rotate: isOpen ? 90 : 0 }}
                    transition={microTransition}
                    style={{ flexShrink: 0, opacity: 0.35 }}
                  >
                    <ChevronRightIcon style={{ width: 13, height: 13 }} />
                  </motion.span>
                </motion.button>
              ) : (
                <Link
                  href={item.href ?? '#'}
                  onClick={() => {
                    if (item.href) {
                      onNavLinkClick(item.href)
                    }

                    if (inDrawer) {
                      closeDrawer()
                    }
                  }}
                  style={{
                    display: 'flex',
                    width: '100%',
                    alignItems: 'center',
                    gap: 9,
                    padding: '7px 10px',
                    borderRadius: 8,
                    textDecoration: 'none',
                    fontSize: 13,
                    fontWeight: isActive ? 500 : 400,
                    color: isActive ? 'var(--accent)' : 'var(--fg-muted)',
                    backgroundColor: isActive ? 'var(--accent-subtle)' : 'transparent',
                    borderLeft: isActive
                      ? '2px solid var(--accent)'
                      : '2px solid transparent',
                    transition: 'background-color 0.15s ease, color 0.15s ease',
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      color: isActive ? 'var(--accent)' : 'var(--fg-muted)',
                      opacity: isActive ? 1 : 0.55,
                    }}
                  >
                    {item.icon}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.label}
                  </span>
                </Link>
              )}

              {hasChildren && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateRows: isOpen ? '1fr' : '0fr',
                    marginBottom: isOpen ? 2 : 0,
                    transition: accordionTransition,
                  }}
                >
                  <div style={{ overflow: 'hidden' }}>
                    <div
                      style={{
                        marginLeft: 22,
                        borderLeft: '1px solid var(--border)',
                        padding: '4px 0 4px 12px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                      }}
                    >
                      {item.children?.map((child, idx) => {
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
                              onNavLinkClick(child.href)
                              if (inDrawer) {
                                closeDrawer()
                              }
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              padding: '6px 10px',
                              borderRadius: 6,
                              textDecoration: 'none',
                              fontSize: 12.5,
                              fontWeight: isChildItemActive ? 500 : 400,
                              color: isChildItemActive
                                ? 'var(--accent)'
                                : 'var(--fg-muted)',
                              backgroundColor: isChildItemActive
                                ? 'var(--accent-subtle)'
                                : 'transparent',
                              opacity: isOpen ? 1 : 0,
                              transform: isOpen
                                ? 'translateX(0)'
                                : 'translateX(-4px)',
                              transition: `background-color 0.12s ease, color 0.12s ease, opacity 0.18s ease ${idx * 25}ms, transform 0.18s cubic-bezier(0.16,1,0.3,1) ${idx * 25}ms`,
                            }}
                          >
                            <span
                              style={{
                                width: isChildItemActive ? 5 : 3.5,
                                height: isChildItemActive ? 5 : 3.5,
                                borderRadius: '50%',
                                flexShrink: 0,
                                backgroundColor: isChildItemActive
                                  ? 'var(--accent)'
                                  : 'var(--fg-muted)',
                                opacity: isChildItemActive ? 1 : 0.35,
                                transition: 'all 0.16s ease',
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
        })}
      </nav>

      <div
        style={{
          flexShrink: 0,
          borderTop: '1px solid var(--border)',
          padding: '8px',
          paddingBottom: inDrawer ? 'max(8px, env(safe-area-inset-bottom))' : 8,
        }}
      >
        {footer}
      </div>
    </div>
  )
}
