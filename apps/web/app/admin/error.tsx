'use client'

import { useEffect } from 'react'
import RouteErrorFallback from '../components/ui/RouteErrorFallback'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <RouteErrorFallback
      title="관리자 화면을 불러오지 못했습니다"
      description="잠시 후 다시 시도해주세요."
      onRetry={reset}
    />
  )
}
