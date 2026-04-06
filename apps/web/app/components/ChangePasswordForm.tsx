'use client'

import { useState } from 'react'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import LogoutButton from './LogoutButton'

const ThemeToggle = dynamic(() => import('./ThemeToggle'), {
  ssr: false,
  loading: () => <div className="h-9 w-9 rounded-lg" aria-hidden="true" />,
})

type ChangePasswordFormProps = {
  accountId: string
  role: 'student' | 'teacher'
}

export default function ChangePasswordForm({
  accountId,
  role,
}: ChangePasswordFormProps) {
  const router = useRouter()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErrorMessage('')

    if (newPassword !== confirmPassword) {
      setErrorMessage('새 비밀번호 확인이 일치하지 않습니다.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newPassword,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        setErrorMessage(payload?.message ?? '비밀번호를 변경하지 못했습니다.')
        return
      }

      const redirectTo =
        typeof payload?.redirectTo === 'string' && payload.redirectTo.length > 0
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
    <section className="flex min-h-screen flex-1 flex-col bg-brand-offwhite transition-colors duration-300 dark:bg-brand-ink">
      <div className="flex items-center justify-between px-8 pt-8 md:px-12">
        <div className="flex items-center gap-2 md:hidden">
          <Image src="/gbsw-logo.png" alt="GBSW" width={26} height={26} />
          <span
            className="text-sm font-semibold text-brand-navy dark:text-[#e2e1f0]"
            style={{ fontFamily: 'var(--font-space-grotesk)' }}
          >
            GBSW Platform
          </span>
        </div>
        <div className="hidden md:block" />
        <ThemeToggle />
      </div>

      <div className="flex flex-1 items-center justify-center px-8 py-12 md:px-16">
        <div className="w-full max-w-[360px]">
          <div className="mb-9">
            <p
              className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-accent dark:text-brand-accent-dark"
              style={{ fontFamily: 'var(--font-space-grotesk)' }}
            >
              Password Update
            </p>
            <h1
              className="mt-3 text-[1.65rem] font-bold leading-tight text-brand-navy dark:text-[#e2e1f0]"
              style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
            >
              첫 로그인 비밀번호를 바꿔주세요
            </h1>
            <p
              className="mt-2 text-sm leading-relaxed text-brand-muted"
              style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
            >
              {role === 'student' ? '학생' : '교사'} 계정{' '}
              <span className="font-semibold text-brand-navy dark:text-[#e2e1f0]">
                {accountId}
              </span>
              는 임시 비밀번호 상태입니다. 현재 비밀번호 확인 없이 새 비밀번호를
              설정한 뒤 계속 진행할 수 있습니다.
            </p>
            <div
              className="mt-3 rounded-md border border-brand-accent/15 bg-brand-accent/5 px-3.5 py-2.5 text-xs text-brand-muted dark:border-brand-accent-dark/20 dark:bg-brand-accent-dark/10"
              style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
            >
              임시 비밀번호 변경 상태에서만 현재 비밀번호 입력이 생략됩니다.
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <PasswordField
              id="new-password"
              label="새 비밀번호"
              autoComplete="new-password"
              placeholder="새 비밀번호를 입력하세요"
              value={newPassword}
              onChange={setNewPassword}
              isVisible={showNewPassword}
              onToggleVisibility={() => setShowNewPassword((value) => !value)}
              disabled={isSubmitting}
              helperText="10자 이상이어야 하며 공백만으로는 설정할 수 없습니다."
              icon={<LockIcon />}
            />
            <PasswordField
              id="confirm-password"
              label="새 비밀번호 확인"
              autoComplete="new-password"
              placeholder="새 비밀번호를 다시 입력하세요"
              value={confirmPassword}
              onChange={setConfirmPassword}
              isVisible={showConfirmPassword}
              onToggleVisibility={() =>
                setShowConfirmPassword((value) => !value)
              }
              disabled={isSubmitting}
              icon={<LockIcon />}
            />

            {errorMessage ? (
              <p
                className="rounded-md border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
                style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
              >
                {errorMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative w-full overflow-hidden rounded-md bg-brand-accent px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
              style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
            >
              <span
                className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background:
                    'linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.15) 50%, transparent 70%)',
                  animation: 'shimmer 1.8s linear infinite',
                }}
              />
              <span className="relative">
                {isSubmitting ? '변경 중...' : '비밀번호 변경'}
              </span>
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between gap-3 text-xs text-brand-muted">
            <span
              style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
            >
              다른 계정으로 다시 로그인하려면
            </span>
            <LogoutButton
              className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-brand-navy transition-colors duration-150 hover:bg-black/[0.03] dark:border-white/10 dark:text-[#e2e1f0] dark:hover:bg-white/[0.05]"
              style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
            >
              로그아웃
            </LogoutButton>
          </div>
        </div>
      </div>
    </section>
  )
}

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
  icon: React.ReactNode
}

function PasswordField({
  id,
  label,
  autoComplete,
  placeholder,
  value,
  onChange,
  isVisible,
  onToggleVisibility,
  disabled,
  helperText,
  icon,
}: FieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-1.5 block text-xs font-semibold text-brand-navy dark:text-white/60"
        style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
      >
        {label}
      </label>
      <div className="relative">
        <span
          className="pointer-events-none absolute left-3.5 top-1/2 flex -translate-y-1/2 items-center text-gray-400 dark:text-white/25"
          aria-hidden="true"
        >
          {icon}
        </span>
        <input
          id={id}
          type={isVisible ? 'text' : 'password'}
          autoComplete={autoComplete}
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className="w-full rounded-md border border-gray-200 bg-white py-2.5 pl-9 pr-10 text-sm text-brand-navy outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/15 dark:border-white/10 dark:bg-white/[0.06] dark:text-[#e2e1f0] dark:placeholder:text-white/20 dark:focus:border-brand-accent-dark dark:focus:ring-brand-accent-dark/15"
          style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
        />
        <button
          type="button"
          aria-label={isVisible ? '비밀번호 숨기기' : '비밀번호 표시'}
          onClick={onToggleVisibility}
          className="absolute right-3.5 top-1/2 flex -translate-y-1/2 items-center text-gray-400 transition-colors duration-150 hover:text-brand-accent dark:text-white/25 dark:hover:text-brand-accent-dark"
        >
          {isVisible ? <EyeOffIcon /> : <EyeOpenIcon />}
        </button>
      </div>
      {helperText ? (
        <p
          className="mt-1.5 text-xs text-brand-muted"
          style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
        >
          {helperText}
        </p>
      ) : null}
    </div>
  )
}

function LockIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function EyeOpenIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}
