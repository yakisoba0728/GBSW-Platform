'use client'

import RouteErrorFallback from '../components/ui/RouteErrorFallback'

export default function TeacherError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <RouteErrorFallback
      title="교사 화면을 불러오지 못했습니다"
      description="페이지를 새로 고쳐 다시 시도해주세요."
      onRetry={reset}
    />
  )
}
