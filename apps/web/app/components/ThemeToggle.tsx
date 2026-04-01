'use client'

import { useTheme } from 'next-themes'

type DocumentWithVT = Document & {
  startViewTransition?: (callback: () => void) => { finished: Promise<void> }
}

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  function handleThemeChange() {
    const next = isDark ? 'light' : 'dark'
    const html = document.documentElement
    const doc = document as DocumentWithVT

    // ── View Transitions API (Chrome 111+, Safari 18+) ──────────────
    // element-level transition이 스냅샷을 오염시키지 않도록
    // no-transitions를 먼저 적용한 뒤 전체 화면 크로스페이드
    if (doc.startViewTransition) {
      html.classList.add('no-transitions')
      const vt = doc.startViewTransition(() => setTheme(next))
      vt.finished
        .then(() => html.classList.remove('no-transitions'))
        .catch(() => html.classList.remove('no-transitions'))
      return
    }

    // ── Fallback: 전체 화면 오버레이 (Firefox 등) ────────────────────
    // 새 테마 배경색 오버레이로 화면 전체를 덮어 seam 제거
    // 오버레이가 불투명해진 뒤 테마를 바꾸고, 오버레이를 걷어냄
    const overlay = document.createElement('div')
    const bg = next === 'dark' ? '#0e0e18' : '#f4f3ef'
    overlay.style.cssText = `
      position:fixed; inset:0; z-index:9999;
      background:${bg};
      opacity:0; pointer-events:none; will-change:opacity;
    `
    document.body.appendChild(overlay)

    // 페이드인 (180ms)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlay.style.transition = 'opacity 180ms ease'
        overlay.style.opacity = '1'
      })
    })

    // 테마 전환 → 페이드아웃 (280ms)
    // 오버레이가 불투명한 상태에서 no-transitions 적용 후 테마 전환:
    // 모든 element 트랜지션을 동결한 채 CSS 변수를 즉시 변경하고,
    // 1프레임 후 트랜지션 복원 → 요소들이 이미 최종 상태이므로 오버레이를 걷어낼 때 seam 없음
    setTimeout(() => {
      html.classList.add('no-transitions')
      setTheme(next)
      requestAnimationFrame(() => {
        html.classList.remove('no-transitions')
        overlay.style.transition = 'opacity 280ms ease'
        overlay.style.opacity = '0'
        setTimeout(() => overlay.remove(), 300)
      })
    }, 200)
  }

  return (
    <button
      type="button"
      onClick={handleThemeChange}
      aria-label={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
      className={`
        relative w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer
        ${isDark
          ? 'bg-white/10 hover:bg-white/15 text-yellow-300'
          : 'bg-black/5 hover:bg-black/10 text-brand-navy'
        }
      `}
      style={{ transition: 'background-color 250ms ease, color 250ms ease' }}
    >
      {/* Sun icon (다크 모드일 때 표시) */}
      <span
        aria-hidden="true"
        style={{
          display: 'block',
          position: 'absolute',
          opacity: isDark ? 1 : 0,
          transform: isDark ? 'rotate(0deg) scale(1)' : 'rotate(20deg) scale(0.85)',
          transition: 'opacity 250ms ease, transform 250ms ease',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <line x1="12" y1="2" x2="12" y2="4" />
          <line x1="12" y1="20" x2="12" y2="22" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="2" y1="12" x2="4" y2="12" />
          <line x1="20" y1="12" x2="22" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      </span>

      {/* Moon icon (라이트 모드일 때 표시) */}
      <span
        aria-hidden="true"
        style={{
          display: 'block',
          position: 'absolute',
          opacity: isDark ? 0 : 1,
          transform: isDark ? 'rotate(-20deg) scale(0.85)' : 'rotate(0deg) scale(1)',
          transition: 'opacity 250ms ease, transform 250ms ease',
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </span>
    </button>
  )
}
