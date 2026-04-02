'use client'

import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'

// ─── ModalBase ────────────────────────────────────────────────────────────────
// 범용 모달 베이스. enter/exit 애니메이션을 double rAF로 안전하게 트리거.
// 학생 탭, 교사 탭 등 모든 탭에서 공유 사용 가능.
//
// 수정 내역:
// - setTimeout(10ms) → double requestAnimationFrame (브라우저 페인트 타이밍 보장)
// - timerRef 공유 제거 → rafRef / exitTimerRef / focusTimerRef 분리
// - idle 상태에 opacity-0 적용 (초기 렌더 깜빡임 방지)

type AnimPhase = 'idle' | 'enter' | 'exit'

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
  // visible: DOM 에 존재하는지 여부 (false → return null)
  // animPhase: 현재 애니메이션 단계 → CSS 클래스 결정
  const [visible, setVisible] = useState(isOpen)
  const [animPhase, setAnimPhase] = useState<AnimPhase>('idle')

  const rafRef = useRef<number | null>(null)
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  // isOpen 변경 → 애니메이션 상태 전환
  useEffect(() => {
    // 진행 중인 모든 타이머/rAF 취소
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
        setAnimPhase('idle') // DOM 삽입 전 투명 상태
        // double rAF: 첫 번째 rAF → DOM 삽입 확인, 두 번째 rAF → CSS 트랜지션 트리거
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
      }, 220) // animate-overlay-exit 지속시간
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

  // enter 완료 후 패널에 포커스 (별도 ref — exit timer 덮어씌움 방지)
  useEffect(() => {
    if (animPhase !== 'enter') return
    focusTimerRef.current = setTimeout(() => {
      panelRef.current?.focus()
      focusTimerRef.current = null
    }, 80)
    return () => {
      if (focusTimerRef.current !== null) {
        clearTimeout(focusTimerRef.current)
        focusTimerRef.current = null
      }
    }
  }, [animPhase])

  // Escape 키로 닫기
  useEffect(() => {
    if (!visible) return
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [visible, onClose])

  if (!visible) return null

  // idle: 투명 (DOM 삽입 직후 깜빡임 방지)
  const overlayClass =
    animPhase === 'enter' ? 'animate-overlay-enter'
    : animPhase === 'exit' ? 'animate-overlay-exit'
    : 'opacity-0'

  const panelClass =
    animPhase === 'enter' ? 'animate-scale-in'
    : animPhase === 'exit' ? 'animate-scale-out'
    : 'opacity-0'

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center px-3 py-4 ${overlayClass}`}
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
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
// window.confirm() 대체. 삭제·위험 동작 전 사용자 확인.
// variant='danger' → 빨간 확인 버튼 + 휴지통 아이콘
// variant='default' → 보라(accent) 확인 버튼 + 정보 아이콘

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
  onConfirm: () => void
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
        className="overflow-hidden rounded-2xl border"
        style={{ backgroundColor: 'var(--admin-sidebar-bg)', borderColor: 'var(--admin-border)' }}
      >
        <div className="px-6 pb-5 pt-6">
          {/* 아이콘 */}
          <div
            className="mb-4 flex h-11 w-11 items-center justify-center rounded-full"
            style={{ backgroundColor: isDanger ? 'rgba(239,68,68,0.1)' : 'var(--admin-accent-bg)' }}
          >
            {isDanger ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6" /><path d="M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--admin-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            )}
          </div>

          <p className="text-sm font-semibold" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text)' }}>
            {title}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-line" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text-muted)' }}>
            {message}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4" style={{ borderTop: '1px solid var(--admin-border)' }}>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
            style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', borderColor: 'var(--admin-border)', color: 'var(--admin-text-muted)' }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => { onConfirm(); onClose() }}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', backgroundColor: isDanger ? '#dc2626' : 'var(--admin-accent)' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </ModalBase>
  )
}

// ─── AlertModal ───────────────────────────────────────────────────────────────
// 성공·오류·정보·경고 팝업. 3.5초 자동 닫힘 + progress bar.

type AlertType = 'success' | 'error' | 'info' | 'warning'

const ALERT_CONFIG: Record<
  AlertType,
  { color: string; bgColor: string; icon: ReactNode }
> = {
  success: {
    color: '#15803d',
    bgColor: 'rgba(34,197,94,0.1)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
  },
  error: {
    color: '#b91c1c',
    bgColor: 'rgba(239,68,68,0.1)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
  },
  info: {
    color: 'var(--admin-accent)',
    bgColor: 'var(--admin-accent-bg)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--admin-accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
  },
  warning: {
    color: '#b45309',
    bgColor: 'rgba(245,158,11,0.1)',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b45309" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
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

  // 3.5초 자동 닫힘
  useEffect(() => {
    if (!isOpen) return
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [isOpen, onClose])

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} maxWidth="max-w-sm">
      <div
        className="overflow-hidden rounded-2xl border"
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
            <p className="text-sm font-semibold" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text)' }}>
              {title}
            </p>
            {message && (
              <p className="mt-1 text-sm leading-relaxed" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text-muted)' }}>
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
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* 자동 닫힘 progress bar */}
        {isOpen && (
          <div className="h-0.5 w-full" style={{ backgroundColor: 'var(--admin-border)' }}>
            <div
              className="h-full"
              style={{ backgroundColor: config.color, animation: 'progressShrink 3.5s linear forwards' }}
            />
          </div>
        )}
      </div>
    </ModalBase>
  )
}
