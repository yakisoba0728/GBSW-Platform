import AuthShell from './components/auth/AuthShell'
import LoginForm from './components/LoginForm'
import { redirectAuthenticatedSession } from '@/lib/route-guards'

export default async function Home() {
  await redirectAuthenticatedSession()

  return (
    <AuthShell>
      <div style={{ flex: 1, height: '100%' }}>
        <LoginForm />
      </div>
    </AuthShell>
  )
}
