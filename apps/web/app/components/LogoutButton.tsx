'use client'

import { useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'

type LogoutButtonProps = {
  children?: ReactNode
  className?: string
  style?: CSSProperties
}

export default function LogoutButton({
  children,
  className,
  style,
}: LogoutButtonProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  async function handleLogout() {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // 네트워크 오류여도 '/'로 이동 (graceful degradation)
    } finally {
      window.location.href = '/'
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
      className={className}
      style={style}
    >
      {isLoggingOut ? '로그아웃 중...' : (children ?? '로그아웃')}
    </button>
  )
}
