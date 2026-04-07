'use client'

import { useEffect, type ReactNode } from 'react'
import { dispatchAppNavigationStart } from '@/lib/url-state'

export default function LoadingState({
  children,
}: {
  children?: ReactNode
}) {
  useEffect(() => {
    dispatchAppNavigationStart()
  }, [])

  return <>{children}</>
}
