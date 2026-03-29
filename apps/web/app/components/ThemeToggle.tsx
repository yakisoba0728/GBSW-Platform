'use client'

import { useTheme } from 'next-themes'

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
      className={`
        relative w-9 h-9 rounded-lg flex items-center justify-center
        transition-all duration-300 cursor-pointer
        ${isDark
          ? 'bg-white/10 hover:bg-white/15 text-yellow-300'
          : 'bg-black/5 hover:bg-black/10 text-brand-navy'
        }
      `}
    >
      <span
        className="transition-all duration-300"
        style={{
          display: 'block',
          transform: isDark ? 'rotate(0deg) scale(1)' : 'rotate(20deg) scale(0.9)',
          opacity: isDark ? 1 : 0,
          position: 'absolute',
        }}
      >
        {/* Sun icon */}
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
      <span
        className="transition-all duration-300"
        style={{
          display: 'block',
          transform: isDark ? 'rotate(-20deg) scale(0.9)' : 'rotate(0deg) scale(1)',
          opacity: isDark ? 0 : 1,
          position: 'absolute',
        }}
      >
        {/* Moon icon */}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      </span>
    </button>
  )
}
