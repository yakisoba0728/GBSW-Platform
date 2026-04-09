'use client'

import { useEffect } from 'react'
import { dispatchAppNavigationComplete } from '@/lib/url-state'
import { Button } from './button'

export default function RouteErrorFallback({
  title,
  description,
  onRetry,
}: {
  title: string
  description?: string
  onRetry: () => void
}) {
  useEffect(() => {
    dispatchAppNavigationComplete()
  }, [])

  return (
    <div
      className="rounded-xl border px-5 py-5"
      style={{
        borderColor: 'var(--penalty-border)',
        backgroundColor: 'var(--penalty-subtle)',
      }}
    >
      <p
        className="text-sm font-semibold"
        style={{ color: 'var(--penalty)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
      >
        {title}
      </p>
      {description && (
        <p
          className="mt-2 text-xs leading-6"
          style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
        >
          {description}
        </p>
      )}
      <div className="mt-4">
        <Button variant="danger" size="sm" onClick={onRetry}>
          다시 시도
        </Button>
      </div>
    </div>
  )
}
