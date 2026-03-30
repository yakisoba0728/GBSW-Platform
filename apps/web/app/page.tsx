import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import BrandPanel from './components/BrandPanel'
import LoginForm from './components/LoginForm'
import {
  AUTH_SESSION_COOKIE,
  getRedirectPathForRole,
  readAuthSession,
} from '@/lib/auth-session'

export default async function Home() {
  const token = (await cookies()).get(AUTH_SESSION_COOKIE)?.value
  const session = readAuthSession(token)

  if (session) {
    redirect(getRedirectPathForRole(session.role))
  }

  return (
    <main className="flex min-h-screen w-full">
      <BrandPanel />
      <LoginForm />
    </main>
  )
}
