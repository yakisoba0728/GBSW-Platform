import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  AUTH_SESSION_COOKIE,
  getRedirectPathForSession,
  readAuthSession,
} from '@/lib/auth-session'
import AdminDashboard from './components/AdminDashboard'

export default async function AdminPage() {
  const token = (await cookies()).get(AUTH_SESSION_COOKIE)?.value
  const session = readAuthSession(token)

  if (!session) {
    redirect('/')
  }

  if (session.role !== 'super-admin') {
    redirect(getRedirectPathForSession(session))
  }

  return <AdminDashboard />
}
