'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import type { JSX, ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: string
  type: ToastType
  message: string
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function SuccessIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--reward)"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  )
}

function ErrorIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--penalty)"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  )
}

function InfoIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--accent)"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
}

const ICON_MAP: Record<ToastType, () => JSX.Element> = {
  success: SuccessIcon,
  error: ErrorIcon,
  info: InfoIcon,
}

// Border color per type uses CSS custom properties defined in the spec.
// --reward-border and --penalty-border are expected to exist in the theme.
// Fallback gracefully to --border for info.
const BORDER_MAP: Record<ToastType, string> = {
  success: 'var(--reward-border, var(--reward))',
  error: 'var(--penalty-border, var(--penalty))',
  info: 'var(--border)',
}

// ─── ToastItem component ──────────────────────────────────────────────────────

function ToastItemComponent({
  toast: t,
  onClose,
}: {
  toast: ToastItem
  onClose: () => void
}) {
  const Icon = ICON_MAP[t.type]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 60, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } }}
      exit={{ opacity: 0, x: 60, scale: 0.95, transition: { duration: 0.15 } }}
      style={{
        minWidth: 280,
        maxWidth: 380,
        padding: '12px 16px',
        borderRadius: 10,
        background: 'var(--bg)',
        border: `1px solid ${BORDER_MAP[t.type]}`,
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
      }}
    >
      {/* Type icon */}
      <Icon />

      {/* Message */}
      <span
        style={{
          flex: 1,
          fontSize: 14,
          color: 'var(--fg)',
          lineHeight: 1.45,
        }}
      >
        {t.message}
      </span>

      {/* Close button */}
      <button
        onClick={onClose}
        aria-label="닫기"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--fg-muted)',
          padding: 2,
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M3 3l8 8M11 3l-8 8"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </motion.div>
  )
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface ToastContextValue {
  addToast: (message: string, type: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

// ─── Imperative singleton API ─────────────────────────────────────────────────
// ToastProvider 가 마운트되면 addToast 함수를 등록.
// 언마운트 시 no-op 으로 복구.

let toastFn: (message: string, type: ToastType) => void = () => {}

export const toast = {
  success: (message: string) => toastFn(message, 'success'),
  error: (message: string) => toastFn(message, 'error'),
  info: (message: string) => toastFn(message, 'info'),
}

// ─── ToastProvider ────────────────────────────────────────────────────────────

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Date.now().toString()
    setToasts((prev) => {
      const next = [...prev, { id, message, type }]
      // 최대 3개 유지 — 가장 오래된 항목 제거
      return next.slice(-3)
    })
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  // 명령형 API 에 함수 등록
  useEffect(() => {
    toastFn = addToast
    return () => {
      toastFn = () => {}
    }
  }, [addToast])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}

      {/* Toast container — fixed, bottom-right */}
      <div
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 9998,
          display: 'flex',
          flexDirection: 'column-reverse',
          gap: 8,
        }}
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <ToastItemComponent
              key={t.id}
              toast={t}
              onClose={() => removeToast(t.id)}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

// ─── useToast ─────────────────────────────────────────────────────────────────
// 컴포넌트 내부에서 addToast 를 직접 호출할 때 사용.
// ToastProvider 바깥에서 호출하면 에러를 던짐.

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return ctx
}
