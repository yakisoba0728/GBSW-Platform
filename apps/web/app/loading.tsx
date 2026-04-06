import AuthShell from './components/auth/AuthShell'
import LoadingState from './components/ui/LoadingState'
import { PageSkeleton } from './components/ui/page-skeletons'

export default function RootLoading() {
  return (
    <LoadingState>
      <AuthShell>
        <PageSkeleton variant="auth" />
      </AuthShell>
    </LoadingState>
  )
}
