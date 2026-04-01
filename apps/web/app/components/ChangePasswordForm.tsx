'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import LogoutButton from './LogoutButton'

type ChangePasswordFormProps = {
  accountId: string
  role: 'student' | 'teacher'
}

export default function ChangePasswordForm({
  accountId,
  role,
}: ChangePasswordFormProps) {
  const router = useRouter()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
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
          currentPassword,
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
    <section className="flex-1 flex items-center justify-center bg-brand-offwhite px-8 py-12 dark:bg-brand-ink md:px-16">
      <div className="w-full max-w-[420px] rounded-[28px] border border-black/5 bg-white/85 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur dark:border-white/10 dark:bg-white/[0.04] dark:shadow-[0_24px_80px_rgba(2,6,23,0.45)]">
        <div className="mb-7">
          <p
            className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-accent dark:text-brand-accent-dark"
            style={{ fontFamily: 'var(--font-space-grotesk)' }}
          >
            Password Update
          </p>
          <h1
            className="mt-3 text-[1.75rem] font-bold leading-tight text-brand-navy dark:text-[#e2e1f0]"
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
            는 임시 비밀번호 상태입니다. 새 비밀번호를 설정해야 대시보드에
            들어갈 수 있습니다.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <Field
            id="current-password"
            label="현재 비밀번호"
            autoComplete="current-password"
            value={currentPassword}
            onChange={setCurrentPassword}
            disabled={isSubmitting}
          />
          <Field
            id="new-password"
            label="새 비밀번호"
            autoComplete="new-password"
            value={newPassword}
            onChange={setNewPassword}
            disabled={isSubmitting}
            helperText="10자 이상이어야 하며 공백만으로는 설정할 수 없습니다."
          />
          <Field
            id="confirm-password"
            label="새 비밀번호 확인"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            disabled={isSubmitting}
          />

          {errorMessage ? (
            <p
              className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200"
              style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
            >
              {errorMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-brand-accent px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
          >
            {isSubmitting ? '변경 중...' : '비밀번호 변경'}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between gap-3 text-xs text-brand-muted">
          <span style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
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
    </section>
  )
}

type FieldProps = {
  id: string
  label: string
  autoComplete: string
  value: string
  onChange: (value: string) => void
  disabled: boolean
  helperText?: string
}

function Field({
  id,
  label,
  autoComplete,
  value,
  onChange,
  disabled,
  helperText,
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
      <input
        id={id}
        type="password"
        autoComplete={autoComplete}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-brand-navy outline-none transition-all duration-200 placeholder:text-gray-400 focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/15 dark:border-white/10 dark:bg-white/[0.06] dark:text-[#e2e1f0] dark:placeholder:text-white/20 dark:focus:border-brand-accent-dark dark:focus:ring-brand-accent-dark/15"
        style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
      />
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
