import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { isValidSuperAdminSession, SUPER_ADMIN_SESSION_COOKIE } from '@/lib/super-admin-auth'
import AdminDashboard from './components/AdminDashboard'

export default async function AdminPage() {
  const token = (await cookies()).get(SUPER_ADMIN_SESSION_COOKIE)?.value

  if (!isValidSuperAdminSession(token)) {
    redirect('/')
  }

  return <AdminDashboard />
}
