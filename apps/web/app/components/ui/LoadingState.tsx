'use client'

import { useEffect, type ReactNode } from 'react'
import {
  dispatchAppNavigationComplete,
  dispatchAppNavigationStart,
} from '@/lib/url-state'

export default function LoadingState({
  children,
}: {
  children?: ReactNode
}) {
  useEffect(() => {
    dispatchAppNavigationStart()
    return () => {
      dispatchAppNavigationComplete()
    }
  }, [])

  return <>{children}</>
}
