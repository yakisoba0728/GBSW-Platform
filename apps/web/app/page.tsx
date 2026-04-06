import AuthShell from './components/auth/AuthShell'
import LoginForm from './components/LoginForm'
import RouteTransition from './components/ui/RouteTransition'
import { redirectAuthenticatedSession } from '@/lib/route-guards'

export default async function Home() {
  await redirectAuthenticatedSession()

  return (
    <AuthShell>
      <RouteTransition style={{ flex: 1, height: '100%' }}>
        <LoginForm />
      </RouteTransition>
    </AuthShell>
  )
}
