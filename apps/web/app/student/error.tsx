'use client'

import RouteErrorFallback from '../components/ui/RouteErrorFallback'

export default function StudentError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <RouteErrorFallback
      title="학생 화면을 불러오지 못했습니다"
      description="데이터를 다시 받아오도록 재시도할 수 있습니다."
      onRetry={reset}
    />
  )
}
