'use client'

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
  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/'
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={className}
      style={style}
    >
      {children ?? '로그아웃'}
    </button>
  )
}
