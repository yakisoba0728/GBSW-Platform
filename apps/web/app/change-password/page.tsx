import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import BrandPanel from '../components/BrandPanel'
import ChangePasswordForm from '../components/ChangePasswordForm'
import {
  AUTH_SESSION_COOKIE,
  getDefaultRedirectPathForRole,
  readAuthSession,
} from '@/lib/auth-session'

export default async function ChangePasswordPage() {
  const token = (await cookies()).get(AUTH_SESSION_COOKIE)?.value
  const session = readAuthSession(token)

  if (!session) {
    redirect('/')
  }

  if (session.role === 'super-admin') {
    redirect('/admin')
  }

  if (!session.mustChangePassword) {
    redirect(getDefaultRedirectPathForRole(session.role))
  }

  return (
    <main className="flex min-h-screen w-full">
      <BrandPanel />
      <ChangePasswordForm accountId={session.accountId} role={session.role} />
    </main>
  )
}
