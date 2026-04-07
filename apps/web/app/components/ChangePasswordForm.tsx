'use client'

import { useState } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import LogoutButton from './LogoutButton'
import { Button } from './ui/button'
import {
  getInlineMessageMotion,
  getSectionMotion,
  useMotionPreference,
} from './ui/motion'

const ThemeToggle = dynamic(() => import('./ThemeToggle'), {
  ssr: false,
  loading: () => <div style={{ width: 32, height: 32 }} aria-hidden="true" />,
})

type ChangePasswordFormProps = {
  accountId: string
  role: 'super-admin' | 'student' | 'teacher'
  requireCurrentPassword?: boolean
  successRedirectTo?: string
  embedded?: boolean
}

export default function ChangePasswordForm({
  accountId,
  role,
  requireCurrentPassword = false,
  successRedirectTo,
  embedded = false,
}: ChangePasswordFormProps) {
  const router = useRouter()
  const prefersReducedMotion = useMotionPreference()
  const panelMotion = getSectionMotion(prefersReducedMotion)
  const errorMotion = getInlineMessageMotion(prefersReducedMotion)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')

    if (requireCurrentPassword && currentPassword.trim().length === 0) {
      setErrorMessage('현재 비밀번호를 입력해주세요.')
      return
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('새 비밀번호 확인이 일치하지 않습니다.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(requireCurrentPassword ? { currentPassword } : {}),
          newPassword,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        setErrorMessage(payload?.message ?? '비밀번호를 변경하지 못했습니다.')
        return
      }

      const redirectTo =
        typeof successRedirectTo === 'string' && successRedirectTo.length > 0
          ? successRedirectTo
          : typeof payload?.redirectTo === 'string' && payload.redirectTo.length > 0
          ? payload.redirectTo
          : '/'

      router.push(redirectTo)
      router.refresh()
    } catch {
      setErrorMessage('비밀번호 변경 요청 중 문제가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section style={{ display: 'flex', minHeight: embedded ? 'auto' : '100svh', flex: 1, flexDirection: 'column', backgroundColor: 'var(--bg)', transition: 'background-color 0.3s' }}>
      {!embedded && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px' }}>
          <div className="flex lg:hidden" style={{ alignItems: 'center', gap: 8 }}>
            <Image src="/gbsw-logo.png" alt="GBSW" width={22} height={22} style={{ opacity: 0.6 }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fg)' }}>
              GBSW Platform
            </span>
          </div>
          <div className="hidden lg:block" />
          <ThemeToggle />
        </div>
      )}

      {/* 폼 영역 */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: embedded ? '24px' : '24px 32px 40px' }}>
        <motion.div
          initial={panelMotion.initial}
          animate={panelMotion.animate}
          transition={panelMotion.transition}
          style={{ width: '100%', maxWidth: 380 }}
        >
          {/* 헤딩 */}
          <div style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 10 }}>
              Password Update
            </p>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--fg)', lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: 10 }}>
              {role === 'super-admin'
                ? '최고관리자 비밀번호를 변경하세요'
                : '첫 로그인 비밀번호를 바꿔주세요'}
            </h1>
            <p style={{ fontSize: 14, color: 'var(--fg-muted)', lineHeight: 1.6 }}>
              {role === 'super-admin'
                ? '최고관리자 계정 '
                : `${role === 'student' ? '학생' : '교사'} 계정 `}
              <span style={{ fontWeight: 600, color: 'var(--fg)' }}>{accountId}</span>
              {role === 'super-admin'
                ? '의 비밀번호를 제품 안에서 바로 교체할 수 있습니다.'
                : '는 임시 비밀번호 상태입니다. 새 비밀번호를 설정한 뒤 계속 진행할 수 있습니다.'}
            </p>
            <div style={{
              marginTop: 12,
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid var(--accent-border)',
              backgroundColor: 'var(--accent-subtle)',
              fontSize: 12,
              color: 'var(--fg-muted)',
            }}>
              {requireCurrentPassword
                ? '보안을 위해 현재 비밀번호를 먼저 확인합니다.'
                : '임시 비밀번호 변경 상태에서만 현재 비밀번호 입력이 생략됩니다.'}
            </div>
          </div>

          {/* 폼 */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {requireCurrentPassword && (
              <PasswordField
                id="current-password"
                label="현재 비밀번호"
                autoComplete="current-password"
                placeholder="현재 비밀번호를 입력하세요"
                value={currentPassword}
                onChange={setCurrentPassword}
                isVisible={showCurrentPassword}
                onToggleVisibility={() => setShowCurrentPassword((v) => !v)}
                disabled={isSubmitting}
              />
            )}
            <PasswordField
              id="new-password"
              label="새 비밀번호"
              autoComplete="new-password"
              placeholder="새 비밀번호를 입력하세요"
              value={newPassword}
              onChange={setNewPassword}
              isVisible={showNewPassword}
              onToggleVisibility={() => setShowNewPassword((v) => !v)}
              disabled={isSubmitting}
              helperText="10자 이상이어야 하며 공백만으로는 설정할 수 없습니다."
            />
            <PasswordField
              id="confirm-password"
              label="새 비밀번호 확인"
              autoComplete="new-password"
              placeholder="새 비밀번호를 다시 입력하세요"
              value={confirmPassword}
              onChange={setConfirmPassword}
              isVisible={showConfirmPassword}
              onToggleVisibility={() => setShowConfirmPassword((v) => !v)}
              disabled={isSubmitting}
            />

            {/* 에러 메시지 */}
            <AnimatePresence>
              {errorMessage && (
                <motion.p
                  key="error"
                  initial={errorMotion.initial}
                  animate={errorMotion.animate}
                  exit={errorMotion.exit}
                  transition={errorMotion.transition}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: '1px solid var(--penalty-border)',
                    backgroundColor: 'var(--penalty-subtle)',
                    fontSize: 13,
                    color: 'var(--penalty)',
                  }}
                >
                  {errorMessage}
                </motion.p>
              )}
            </AnimatePresence>

            {/* 제출 버튼 */}
            <Button
              type="submit"
              size="lg"
              fullWidth
              loading={isSubmitting}
              className="mt-1"
            >
              비밀번호 변경
            </Button>
          </form>

          {/* 로그아웃 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 20, fontSize: 13, color: 'var(--fg-muted)' }}>
            <span>
              {embedded ? '변경 후에도 현재 세션은 새로 발급됩니다.' : '다른 계정으로 다시 로그인하려면'}
            </span>
            <LogoutButton
              style={{
                padding: '6px 14px',
                borderRadius: 9999,
                border: '1px solid var(--border)',
                background: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 500,
                color: 'var(--fg)',
              }}
            >
              로그아웃
            </LogoutButton>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

// ─── PasswordField ────────────────────────────────────────────────────────────

type FieldProps = {
  id: string
  label: string
  autoComplete: string
  placeholder: string
  value: string
  onChange: (value: string) => void
  isVisible: boolean
  onToggleVisibility: () => void
  disabled: boolean
  helperText?: string
}

function PasswordField({
  id, label, autoComplete, placeholder, value, onChange,
  isVisible, onToggleVisibility, disabled, helperText,
}: FieldProps) {
  const [focused, setFocused] = useState(false)

  return (
    <div>
      <label htmlFor={id} style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--fg)', marginBottom: 6 }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--fg-muted)', opacity: 0.6, pointerEvents: 'none', display: 'flex' }}>
          <LockIcon />
        </span>
        <input
          id={id}
          type={isVisible ? 'text' : 'password'}
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
            paddingRight: 42,
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
        <button
          type="button"
          aria-label={isVisible ? '비밀번호 숨기기' : '비밀번호 표시'}
          onClick={onToggleVisibility}
          style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            display: 'flex', alignItems: 'center',
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--fg-muted)', padding: 2,
          }}
        >
          {isVisible ? <EyeOffIcon /> : <EyeOpenIcon />}
        </button>
      </div>
      {helperText && (
        <p style={{ marginTop: 6, fontSize: 12, color: 'var(--fg-muted)' }}>{helperText}</p>
      )}
    </div>
  )
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  )
}

function EyeOpenIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}
