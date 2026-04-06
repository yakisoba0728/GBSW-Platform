'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CircleCheck, CircleX, Info, X } from 'lucide-react'
import { getToastMotion, useMotionPreference } from './motion'

// ─── Types ────────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: string
  type: ToastType
  message: string
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const ICON_MAP: Record<ToastType, ReactNode> = {
  success: <CircleCheck size={20} color="var(--reward)" strokeWidth={2.2} aria-hidden="true" style={{ flexShrink: 0 }} />,
  error: <CircleX size={20} color="var(--penalty)" strokeWidth={2.2} aria-hidden="true" style={{ flexShrink: 0 }} />,
  info: <Info size={20} color="var(--accent)" strokeWidth={2.2} aria-hidden="true" style={{ flexShrink: 0 }} />,
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
  const prefersReducedMotion = useMotionPreference()
  const motionProps = getToastMotion(prefersReducedMotion)

  return (
    <motion.div
      layout
      initial={motionProps.initial}
      animate={motionProps.animate}
      exit={motionProps.exit}
      transition={motionProps.transition}
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
      {ICON_MAP[t.type]}

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
        <X size={14} strokeWidth={1.5} aria-hidden="true" />
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
