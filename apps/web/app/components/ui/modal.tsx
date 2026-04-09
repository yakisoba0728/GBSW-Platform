'use client'

import { useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, Trash2, Info, CircleCheck, CircleX, AlertTriangle } from 'lucide-react'
import {
  MODAL_BASE_EXIT_DURATION_MS,
  getModalMotion,
  getOverlayMotion,
  useMotionPreference,
} from './motion'
import { acquireBodyScrollLock } from './scroll-lock'

// ─── Modal ────────────────────────────────────────────────────────────────────
// AnimatePresence 기반 범용 모달.
// framer-motion v12 사용 (AnimatePresence + motion.div)

type ModalSize = 'sm' | 'md' | 'lg'

const SIZE_MAP: Record<ModalSize, number> = {
  sm: 420,
  md: 560,
  lg: 720,
}

export function Modal({
  open,
  onClose,
  title,
  children,
  size = 'md',
  hideHeader = false,
}: {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  size?: ModalSize
  hideHeader?: boolean
}) {
  const prefersReducedMotion = useMotionPreference()
  const overlayMotion = getOverlayMotion(prefersReducedMotion)
  const modalMotion = getModalMotion(prefersReducedMotion)
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement | null>(null)
  const previousFocusedElementRef = useRef<HTMLElement | null>(null)

  // Escape 키로 닫기
  useEffect(() => {
    if (!open) return
    previousFocusedElementRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key !== 'Tab') return

      const focusable = getFocusableElements(panelRef.current)

      if (focusable.length === 0) {
        e.preventDefault()
        panelRef.current?.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const activeElement =
        document.activeElement instanceof HTMLElement ? document.activeElement : null

      if (e.shiftKey && activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', handle)
    const focusTimer = window.setTimeout(() => {
      const [firstFocusable] = getFocusableElements(panelRef.current)
      ;(firstFocusable ?? panelRef.current)?.focus()
    }, 0)
    return () => {
      window.clearTimeout(focusTimer)
      window.removeEventListener('keydown', handle)
      previousFocusedElementRef.current?.focus?.()
    }
  }, [open, onClose])

  // body 스크롤 잠금
  useEffect(() => {
    if (!open) return
    return acquireBodyScrollLock()
  }, [open])

  const maxWidth = SIZE_MAP[size]

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            key="modal-overlay"
            initial={overlayMotion.initial}
            animate={overlayMotion.animate}
            exit={overlayMotion.exit}
            transition={overlayMotion.transition}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1000,
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
            }}
          />

          {/* Panel wrapper — pointer-events none so clicks pass through to overlay */}
          <motion.div
            key="modal-panel"
            initial={modalMotion.initial}
            animate={modalMotion.animate}
            exit={modalMotion.exit}
            transition={modalMotion.transition}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 1001,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              pointerEvents: 'none',
            }}
          >
            <div
              ref={panelRef}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? titleId : undefined}
              tabIndex={-1}
              style={{
                pointerEvents: 'auto',
                width: '100%',
                maxWidth,
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                borderRadius: 16,
                boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                maxHeight: 'calc(100dvh - 32px)',
                overflowY: 'auto',
              }}
            >
              {/* Header */}
              {!hideHeader && title && (
                <div
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span
                    id={titleId}
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: 'var(--fg)',
                    }}
                  >
                    {title}
                  </span>
                  <button
                    onClick={onClose}
                    aria-label="닫기"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--fg-muted)',
                      padding: 4,
                      borderRadius: 6,
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <X size={16} strokeWidth={1.5} aria-hidden="true" />
                  </button>
                </div>
              )}

              {/* Content */}
              <div style={{ padding: hideHeader ? 0 : '20px' }}>{children}</div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ─── ModalFooter ──────────────────────────────────────────────────────────────
// 모달 내부 하단 버튼 영역 래퍼.

export function ModalFooter({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
        paddingTop: 16,
        marginTop: 16,
        borderTop: '1px solid var(--border)',
      }}
    >
      {children}
    </div>
  )
}

// ─── ModalBase ────────────────────────────────────────────────────────────────
// 하위 호환성을 위해 기존 ModalBase / ConfirmModal / AlertModal 유지.

type AnimPhase = 'idle' | 'enter' | 'exit'

function getFocusableElements(container: HTMLElement | null) {
  if (!container) {
    return [] as HTMLElement[]
  }

  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  )
}

export function ModalBase({
  isOpen,
  onClose,
  children,
  maxWidth = 'max-w-lg',
}: {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  maxWidth?: string
}) {
  const [visible, setVisible] = useState(isOpen)
  const [animPhase, setAnimPhase] = useState<AnimPhase>('idle')

  const rafRef = useRef<number | null>(null)
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const previousFocusedElementRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (exitTimerRef.current !== null) {
      clearTimeout(exitTimerRef.current)
      exitTimerRef.current = null
    }

    if (isOpen) {
      rafRef.current = requestAnimationFrame(() => {
        setVisible(true)
        setAnimPhase('idle')
        rafRef.current = requestAnimationFrame(() => {
          setAnimPhase('enter')
          rafRef.current = null
        })
      })
    } else if (visible) {
      rafRef.current = requestAnimationFrame(() => {
        setAnimPhase('exit')
        rafRef.current = null
      })
      exitTimerRef.current = setTimeout(() => {
        setVisible(false)
        setAnimPhase('idle')
        exitTimerRef.current = null
      }, MODAL_BASE_EXIT_DURATION_MS)
    }

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      if (exitTimerRef.current !== null) {
        clearTimeout(exitTimerRef.current)
        exitTimerRef.current = null
      }
    }
  }, [isOpen, visible])

  useEffect(() => {
    if (animPhase !== 'enter') return
    focusTimerRef.current = setTimeout(() => {
      const [firstFocusable] = getFocusableElements(panelRef.current)
      ;(firstFocusable ?? panelRef.current)?.focus()
      focusTimerRef.current = null
    }, 80)
    return () => {
      if (focusTimerRef.current !== null) {
        clearTimeout(focusTimerRef.current)
        focusTimerRef.current = null
      }
    }
  }, [animPhase])

  useEffect(() => {
    if (!visible) return
    previousFocusedElementRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key !== 'Tab') return

      const focusable = getFocusableElements(panelRef.current)

      if (focusable.length === 0) {
        e.preventDefault()
        panelRef.current?.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const activeElement =
        document.activeElement instanceof HTMLElement ? document.activeElement : null

      if (e.shiftKey && activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previousFocusedElementRef.current?.focus?.()
    }
  }, [visible, onClose])

  if (!visible) return null

  const overlayClass =
    animPhase === 'enter'
      ? 'animate-overlay-enter'
      : animPhase === 'exit'
        ? 'animate-overlay-exit'
        : 'opacity-0'

  const panelClass =
    animPhase === 'enter'
      ? 'animate-scale-in'
      : animPhase === 'exit'
        ? 'animate-scale-out'
        : 'opacity-0'

  return (
    <div
      role="dialog"
      aria-modal="true"
      className={`fixed inset-0 z-[1002] flex items-center justify-center px-3 py-4 ${overlayClass}`}
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        className={`w-full ${maxWidth} outline-none ${panelClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}

// ─── ConfirmModal ─────────────────────────────────────────────────────────────

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = '확인',
  cancelLabel = '취소',
  variant = 'default',
}: {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
}) {
  const isDanger = variant === 'danger'

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} maxWidth="max-w-sm">
      <div
        className="overflow-hidden rounded-xl border"
        style={{ backgroundColor: 'var(--admin-sidebar-bg)', borderColor: 'var(--admin-border)' }}
      >
        <div className="px-6 pb-5 pt-6">
          <div
            className="mb-4 flex h-11 w-11 items-center justify-center rounded-full"
            style={{ backgroundColor: isDanger ? 'var(--penalty-bg-faint)' : 'var(--admin-accent-bg)' }}
          >
            {isDanger ? (
              <Trash2 size={20} color="var(--penalty)" strokeWidth={2} aria-hidden="true" />
            ) : (
              <Info size={20} color="var(--admin-accent)" strokeWidth={2} aria-hidden="true" />
            )}
          </div>

          <p
            className="text-sm font-semibold"
            style={{
              fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              color: 'var(--admin-text)',
            }}
          >
            {title}
          </p>
          <p
            className="mt-1.5 text-sm"
            style={{
              fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              color: 'var(--admin-text-muted)',
            }}
          >
            {message}
          </p>
        </div>

        <div
          className="flex items-center justify-end gap-2 px-6 py-4"
          style={{ borderTop: '1px solid var(--admin-border)' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
            style={{
              fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              borderColor: 'var(--admin-border)',
              color: 'var(--admin-text-muted)',
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={async () => {
              await onConfirm()
              onClose()
            }}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{
              fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              backgroundColor: isDanger ? 'var(--penalty)' : 'var(--admin-accent)',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </ModalBase>
  )
}

// ─── AlertModal ───────────────────────────────────────────────────────────────

type AlertType = 'success' | 'error' | 'info' | 'warning'

const ALERT_CONFIG: Record<AlertType, { color: string; bgColor: string; icon: ReactNode }> = {
  success: {
    color: '#15803d',
    bgColor: 'var(--reward-bg-faint)',
    icon: <CircleCheck size={20} color="#15803d" strokeWidth={2.2} aria-hidden="true" />,
  },
  error: {
    color: '#b91c1c',
    bgColor: 'var(--penalty-bg-faint)',
    icon: <CircleX size={20} color="#b91c1c" strokeWidth={2.2} aria-hidden="true" />,
  },
  info: {
    color: 'var(--admin-accent)',
    bgColor: 'var(--admin-accent-bg)',
    icon: <Info size={20} color="var(--admin-accent)" strokeWidth={2.2} aria-hidden="true" />,
  },
  warning: {
    color: '#b45309',
    bgColor: 'rgba(245,158,11,0.1)',
    icon: <AlertTriangle size={20} color="#b45309" strokeWidth={2.2} aria-hidden="true" />,
  },
}

export function AlertModal({
  isOpen,
  onClose,
  type,
  title,
  message,
}: {
  isOpen: boolean
  onClose: () => void
  type: AlertType
  title: string
  message?: string
}) {
  const config = ALERT_CONFIG[type]

  useEffect(() => {
    if (!isOpen) return
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [isOpen, onClose])

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} maxWidth="max-w-sm">
      <div
        className="overflow-hidden rounded-xl border"
        style={{ backgroundColor: 'var(--admin-sidebar-bg)', borderColor: 'var(--admin-border)' }}
      >
        <div className="flex items-start gap-4 px-6 py-5">
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: config.bgColor }}
          >
            {config.icon}
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <p
              className="text-sm font-semibold"
              style={{
                fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                color: 'var(--admin-text)',
              }}
            >
              {title}
            </p>
            {message && (
              <p
                className="mt-1 text-sm"
                style={{
                  fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                  color: 'var(--admin-text-muted)',
                }}
              >
                {message}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex-shrink-0 rounded-lg p-1 transition-opacity hover:opacity-60"
            style={{ color: 'var(--admin-text-muted)' }}
            aria-label="닫기"
          >
            <X size={14} strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>

        {isOpen && (
          <div className="h-0.5 w-full" style={{ backgroundColor: 'var(--admin-border)' }}>
            <div
              className="h-full"
              style={{
                backgroundColor: config.color,
                animation: 'progressShrink 3.5s linear forwards',
              }}
            />
          </div>
        )}
      </div>
    </ModalBase>
  )
}
