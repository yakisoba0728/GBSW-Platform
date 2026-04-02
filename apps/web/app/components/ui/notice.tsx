'use client'

// ─── NoticeBox ────────────────────────────────────────────────────────────────
// 인라인 성공·오류 공지 박스. animate-fade-in 등장 애니메이션.
// 학생 탭, 교사 탭 등 모든 탭에서 공유 사용 가능.
//
// 사용 예:
//   {notice && (
//     <NoticeBox
//       type={notice.type}
//       message={notice.message}
//       onDismiss={() => setNotice(null)}
//     />
//   )}

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
        {/* 아이콘 */}
        <span className="mt-0.5 flex-shrink-0">
          {isSuccess ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <polyline points="9 12 11 14 15 10" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          )}
        </span>
        {/* 메시지 */}
        <p className="flex-1 whitespace-pre-line leading-relaxed">{message}</p>
        {/* 닫기 버튼 */}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="flex-shrink-0 rounded p-0.5 opacity-60 transition-opacity hover:opacity-100"
            aria-label="닫기"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
