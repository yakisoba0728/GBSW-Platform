'use client'

import { CircleCheck, CircleX, X } from 'lucide-react'

// ─── NoticeBox ────────────────────────────────────────────────────────────────
// 인라인 성공·오류 공지 박스. animate-fade-in 등장 애니메이션.
// 학생 탭, 교사 탭 등 모든 탭에서 공유 사용 가능.

export function NoticeBox({
  type,
  message,
  onDismiss,
}: {
  type: 'success' | 'error'
  message: string
  onDismiss?: () => void
}) {
  const isSuccess = type === 'success'
  return (
    <div
      className="animate-fade-in rounded-xl border px-4 py-3 text-sm"
      role={isSuccess ? 'status' : 'alert'}
      aria-live={isSuccess ? 'polite' : 'assertive'}
      style={{
        fontFamily: 'var(--font-noto-sans-kr), sans-serif',
        borderColor: isSuccess ? 'var(--reward-border)' : 'var(--penalty-border)',
        backgroundColor: isSuccess ? 'var(--reward-bg-faint)' : 'var(--penalty-bg-faint)',
        color: isSuccess ? 'var(--reward-text)' : 'var(--penalty-text)',
      }}
    >
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex-shrink-0">
          {isSuccess ? (
            <CircleCheck size={14} strokeWidth={2.5} aria-hidden="true" />
          ) : (
            <CircleX size={14} strokeWidth={2.5} aria-hidden="true" />
          )}
        </span>
        <p>{message}</p>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="flex-shrink-0 rounded p-0.5 opacity-60 transition-opacity hover:opacity-100"
            aria-label="닫기"
          >
            <X size={13} strokeWidth={2.5} aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}
