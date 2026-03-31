'use client'

import { useState } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'

const ThemeToggle = dynamic(() => import('./ThemeToggle'), {
  ssr: false,
  loading: () => <div className="w-9 h-9 rounded-lg" aria-hidden="true" />,
})

export default function LoginForm() {
  const router = useRouter()
  const [showPw, setShowPw] = useState(false)
  const [id, setId] = useState('')
  const [pw, setPw] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id,
          password: pw,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        setErrorMessage(payload?.message ?? '로그인에 실패했습니다.')
        return
      }

      const redirectTo =
        typeof payload?.redirectTo === 'string' && payload.redirectTo.length > 0
          ? payload.redirectTo
          : '/'

      router.push(redirectTo)
      router.refresh()
    } catch {
      setErrorMessage('로그인 요청 중 문제가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-brand-offwhite dark:bg-brand-ink transition-colors duration-300 min-h-screen">

      {/* Top bar */}
      <div className="flex items-center justify-between px-8 pt-8 md:px-12">
        {/* Mobile: logo */}
        <div className="flex md:hidden items-center gap-2">
          <Image src="/gbsw-logo.png" alt="GBSW" width={26} height={26} />
          <span
            className="text-brand-navy dark:text-[#e2e1f0] font-semibold text-sm"
            style={{ fontFamily: 'var(--font-space-grotesk)' }}
          >
            GBSW Platform
          </span>
        </div>
        <div className="hidden md:block" />
        <ThemeToggle />
      </div>

      {/* Form area */}
      <div className="flex-1 flex items-center justify-center px-8 py-12 md:px-16">
        <div className="w-full max-w-[360px]">

          {/* Heading */}
          <div
            className="mb-9 opacity-init-0 animate-fade-in-up anim-delay-0"
            style={{ animationFillMode: 'forwards' }}
          >
            <h2
              className="text-[1.65rem] font-bold text-brand-navy dark:text-[#e2e1f0] leading-tight"
              style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
            >
              다시 돌아오셨군요
            </h2>
            <p
              className="mt-1.5 text-sm text-brand-muted"
              style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
            >
              아이디와 비밀번호를 입력해 로그인하세요.
            </p>
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>

            {/* ID field */}
            <div
              className="opacity-init-0 animate-fade-in-up anim-delay-80"
              style={{ animationFillMode: 'forwards' }}
            >
              <label
                htmlFor="login-id"
                className="block text-xs font-semibold text-brand-navy dark:text-white/60 mb-1.5"
                style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
              >
                아이디
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/25 pointer-events-none flex items-center" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </span>
                <input
                  id="login-id"
                  type="text"
                  autoComplete="username"
                  placeholder="아이디를 입력하세요"
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  disabled={isSubmitting}
                  style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
                  className="w-full pl-9 pr-4 py-3 rounded-xl text-sm outline-none transition-all duration-200
                    bg-white dark:bg-white/[0.06]
                    border border-gray-200 dark:border-white/10
                    text-brand-navy dark:text-[#e2e1f0]
                    placeholder:text-gray-400 dark:placeholder:text-white/20
                    focus:border-brand-accent dark:focus:border-brand-accent-dark
                    focus:ring-2 focus:ring-brand-accent/15 dark:focus:ring-brand-accent-dark/15"
                />
              </div>
            </div>

            {/* Password field */}
            <div
              className="opacity-init-0 animate-fade-in-up anim-delay-160"
              style={{ animationFillMode: 'forwards' }}
            >
              <label
                htmlFor="login-pw"
                className="block text-xs font-semibold text-brand-navy dark:text-white/60 mb-1.5"
                style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
              >
                비밀번호
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/25 pointer-events-none flex items-center" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input
                  id="login-pw"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="비밀번호를 입력하세요"
                  value={pw}
                  onChange={(e) => setPw(e.target.value)}
                  disabled={isSubmitting}
                  style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
                  className="w-full pl-9 pr-10 py-3 rounded-xl text-sm outline-none transition-all duration-200
                    bg-white dark:bg-white/[0.06]
                    border border-gray-200 dark:border-white/10
                    text-brand-navy dark:text-[#e2e1f0]
                    placeholder:text-gray-400 dark:placeholder:text-white/20
                    focus:border-brand-accent dark:focus:border-brand-accent-dark
                    focus:ring-2 focus:ring-brand-accent/15 dark:focus:ring-brand-accent-dark/15"
                />
                <button
                  type="button"
                  aria-label={showPw ? '비밀번호 숨기기' : '비밀번호 표시'}
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center
                    text-gray-400 dark:text-white/25
                    hover:text-brand-accent dark:hover:text-brand-accent-dark
                    transition-colors duration-150"
                >
                  {showPw ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <div
              className="pt-1 opacity-init-0 animate-fade-in-up anim-delay-240"
              style={{ animationFillMode: 'forwards' }}
            >
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full py-3 px-6 rounded-xl font-semibold text-sm text-white overflow-hidden
                  bg-brand-accent hover:brightness-110 active:scale-[0.98]
                  transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-70
                  shadow-[0_2px_10px_rgba(67,56,202,0.16)] dark:shadow-[0_2px_12px_rgba(99,102,241,0.14)]"
                style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
              >
                <span
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{
                    background: 'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)',
                    animation: 'shimmer 1.8s linear infinite',
                  }}
                />
                <span className="relative">{isSubmitting ? '로그인 중...' : '로그인'}</span>
              </button>
            </div>

            {errorMessage ? (
              <p
                className="text-sm text-red-500"
                style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
              >
                {errorMessage}
              </p>
            ) : null}
          </form>

          {/* 학생회 문의 안내 */}
          <div
            className="mt-8 opacity-init-0 animate-fade-in-up anim-delay-320"
            style={{ animationFillMode: 'forwards' }}
          >
            <p
              className="text-center text-xs text-brand-muted"
              style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
            >
              정보를 찾을 수 없나요?{' '}
              <span className="text-brand-accent dark:text-brand-accent-dark font-medium">
                학생회로 문의해 주세요.
              </span>
            </p>
          </div>

        </div>
      </div>

      {/* Mobile bottom */}
      <div className="md:hidden flex flex-col items-center justify-center gap-0.5 pb-8">
        <p className="text-xs text-brand-muted/50" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
          ⓒ 2026. 경북소프트웨어마이스터고등학교 All Rights Reserved.
        </p>
        <p className="text-xs text-brand-muted/30" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
          Made by <span className="text-brand-muted/50">김동혁</span>
        </p>
      </div>
    </div>
  )
}
