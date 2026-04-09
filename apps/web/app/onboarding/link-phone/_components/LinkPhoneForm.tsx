'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/app/components/ui/button'

export default function LinkPhoneForm({ role }: { role: 'student' | 'teacher' }) {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const redirectTo = role === 'student' ? '/student' : '/teacher'

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      const res = await fetch('/api/auth/link-phone', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const payload = await res.json().catch(() => null)

      if (!res.ok) {
        setError(payload?.message ?? '전화번호 저장에 실패했습니다.')
        return
      }

      router.push(redirectTo)
      router.refresh()
    } catch {
      setError('전화번호 저장 요청 중 문제가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleSkip() {
    router.push(redirectTo)
    router.refresh()
  }

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 32px 40px' }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ marginBottom: 28 }}>
          <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 10 }}>
            Step 3 / 3
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--fg)', letterSpacing: '-0.02em', marginBottom: 10 }}>
            전화번호를 연동해주세요
          </h1>
          <p style={{ fontSize: 14, color: 'var(--fg-muted)', lineHeight: 1.6 }}>
            전화번호 연동은 권장 사항입니다. 지금 건너뛰어도 다음 단계로 바로 진행할 수 있고, 나중에 다시 설정할 수 있습니다.
          </p>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label htmlFor="phone" style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--fg)', marginBottom: 6 }}>
              전화번호
            </label>
            <input
              id="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="010-0000-0000"
              disabled={isSubmitting}
              style={{
                width: '100%', height: 40, padding: '0 12px', fontSize: 14,
                color: 'var(--fg)', backgroundColor: 'var(--bg)',
                border: '1px solid var(--border)', borderRadius: 8, outline: 'none',
              }}
            />
          </div>

          {error && (
            <p style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid var(--penalty-border)', backgroundColor: 'var(--penalty-subtle)', fontSize: 13, color: 'var(--penalty)' }}>
              {error}
            </p>
          )}

          <Button type="submit" size="lg" fullWidth loading={isSubmitting} disabled={!phone.trim()}>
            저장하고 계속
          </Button>
          <Button type="button" variant="outline" size="lg" fullWidth onClick={handleSkip} disabled={isSubmitting}>
            건너뛰기
          </Button>
        </form>
      </div>
    </div>
  )
}
