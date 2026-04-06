'use client'

import AuthShell from './components/auth/AuthShell'
import RouteErrorFallback from './components/ui/RouteErrorFallback'

export default function RootError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <AuthShell>
      <section
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 32px 40px',
        }}
      >
        <div className="w-full max-w-[420px]">
          <RouteErrorFallback
            title="페이지를 불러오지 못했습니다"
            description="잠시 후 다시 시도해주세요."
            onRetry={reset}
          />
        </div>
      </section>
    </AuthShell>
  )
}
