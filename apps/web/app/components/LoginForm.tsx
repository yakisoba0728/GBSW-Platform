'use client'

import { useState } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from './ui/button'
import { getSectionMotion, useMotionPreference } from './ui/motion'

const ThemeToggle = dynamic(() => import('./ThemeToggle'), {
  ssr: false,
  loading: () => <div style={{ width: 32, height: 32 }} aria-hidden="true" />,
})

// ─── 인라인 InputField (로그인 폼 전용, 아이콘 포함) ─────────────────────────

function InputField({
  id,
  label,
  type,
  placeholder,
  value,
  onChange,
  disabled,
  autoComplete,
  icon,
  rightAction,
  delay,
}: {
  id: string
  label: string
  type: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  disabled: boolean
  autoComplete: string
  icon: React.ReactNode
  rightAction?: React.ReactNode
  delay: number
}) {
  const [focused, setFocused] = useState(false)
  const prefersReducedMotion = useMotionPreference()
  const motionProps = getSectionMotion(prefersReducedMotion, delay)

  return (
    <motion.div
      initial={motionProps.initial}
      animate={motionProps.animate}
      transition={motionProps.transition}
    >
      <label htmlFor={id} style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--fg)', marginBottom: 6 }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-muted)', opacity: 0.6, pointerEvents: 'none', display: 'flex' }}>
          {icon}
        </span>
        <input
          id={id}
          type={type}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: '100%',
            height: 40,
            paddingLeft: 38,
            paddingRight: rightAction ? 42 : 12,
            fontSize: 14,
            color: 'var(--fg)',
            backgroundColor: 'var(--bg)',
            border: `1px solid ${focused ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 8,
            outline: 'none',
            boxShadow: focused ? '0 0 0 3px var(--accent-subtle)' : 'none',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
            opacity: disabled ? 0.6 : 1,
          }}
        />
        {rightAction && (
          <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>
            {rightAction}
          </span>
        )}
      </div>
    </motion.div>
  )
}

// ─── LoginForm ────────────────────────────────────────────────────────────────

export default function LoginForm() {
  const router = useRouter()
  const prefersReducedMotion = useMotionPreference()
  const headingMotion = getSectionMotion(prefersReducedMotion)
  const buttonMotion = getSectionMotion(prefersReducedMotion, 0.15)
  const footerMotion = getSectionMotion(prefersReducedMotion, 0.25)
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, password: pw }),
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
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg)', minHeight: '100svh', transition: 'background-color 0.3s' }}>
      {/* 상단 바 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px' }}>
        {/* 모바일: 로고 */}
        <div className="flex lg:hidden" style={{ alignItems: 'center', gap: 8 }}>
          <Image src="/gbsw-logo.png" alt="GBSW" width={22} height={22} style={{ opacity: 0.6 }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>
            GBSW Platform
          </span>
        </div>
        <div className="hidden lg:block" />
        <ThemeToggle />
      </div>

      {/* 폼 영역 */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 32px 40px' }}>
        <div style={{ width: '100%', maxWidth: 360 }}>
          {/* 헤딩 */}
          <motion.div
            initial={headingMotion.initial}
            animate={headingMotion.animate}
            transition={headingMotion.transition}
            style={{ marginBottom: 32 }}
          >
            <h2 style={{ fontSize: 26, fontWeight: 700, color: 'var(--fg)', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
              다시 돌아오셨군요
            </h2>
            <p style={{ marginTop: 8, fontSize: 14, color: 'var(--fg-muted)' }}>
              아이디와 비밀번호를 입력해 로그인하세요.
            </p>
          </motion.div>

          {/* 폼 */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* 아이디 */}
            <InputField
              id="login-id"
              label="아이디"
              type="text"
              placeholder="아이디를 입력하세요"
              value={id}
              onChange={setId}
              disabled={isSubmitting}
              autoComplete="username"
              delay={0.05}
              icon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              }
            />

            {/* 비밀번호 */}
            <InputField
              id="login-pw"
              label="비밀번호"
              type={showPw ? 'text' : 'password'}
              placeholder="비밀번호를 입력하세요"
              value={pw}
              onChange={setPw}
              disabled={isSubmitting}
              autoComplete="current-password"
              delay={0.1}
              icon={
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              }
              rightAction={
                <button
                  type="button"
                  aria-label={showPw ? '비밀번호 숨기기' : '비밀번호 표시'}
                  onClick={() => setShowPw((v) => !v)}
                  style={{ display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fg-muted)', padding: 2 }}
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
              }
            />

            {/* 에러 메시지 */}
            <AnimatePresence>
              {errorMessage && (
                <motion.p
                  key="error"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                  style={{ fontSize: 13, color: 'var(--penalty)', marginTop: -4 }}
                >
                  {errorMessage}
                </motion.p>
              )}
            </AnimatePresence>

            {/* 제출 버튼 */}
            <motion.div
              initial={buttonMotion.initial}
              animate={buttonMotion.animate}
              transition={buttonMotion.transition}
              style={{ paddingTop: 4 }}
            >
              <Button
                type="submit"
                size="lg"
                fullWidth
                loading={isSubmitting}
              >
                로그인
              </Button>
            </motion.div>
          </form>

          {/* 안내 문구 */}
          <motion.div
            initial={footerMotion.initial}
            animate={footerMotion.animate}
            transition={footerMotion.transition}
            style={{ marginTop: 28, textAlign: 'center' }}
          >
            <p style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
              정보를 찾을 수 없나요?{' '}
              <span style={{ color: 'var(--accent)', fontWeight: 500 }}>학생회로 문의해 주세요.</span>
            </p>
          </motion.div>
        </div>
      </div>

      {/* 모바일 하단 저작권 */}
      <div className="flex lg:hidden" style={{ flexDirection: 'column', alignItems: 'center', gap: 2, paddingBottom: 24 }}>
        <p style={{ fontSize: 11, color: 'var(--fg-muted)', opacity: 0.5 }}>
          ⓒ 2026. 경북소프트웨어마이스터고등학교 All Rights Reserved.
        </p>
        <p style={{ fontSize: 11, color: 'var(--fg-muted)', opacity: 0.35 }}>
          Made by <span style={{ opacity: 0.85 }}>김동혁</span>
        </p>
      </div>
    </div>
  )
}
