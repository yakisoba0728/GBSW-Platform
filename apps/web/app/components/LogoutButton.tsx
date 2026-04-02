'use client'

import { useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

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
  const router = useRouter()

  async function handleLogout() {
    if (isLoggingOut) return
    setIsLoggingOut(true)

    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' })

      if (!response.ok) {
        throw new Error('logout_failed')
      }

      router.replace('/')
      router.refresh()
    } catch {
      window.location.assign('/')
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
