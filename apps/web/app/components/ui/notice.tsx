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
      role="status"
      aria-live="polite"
      style={{
        fontFamily: 'var(--font-noto-sans-kr), sans-serif',
        borderColor: isSuccess ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.35)',
        backgroundColor: isSuccess ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
        color: isSuccess ? '#166534' : '#991b1b',
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
