import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import BrandPanel from './components/BrandPanel'
import LoginForm from './components/LoginForm'
import { isValidSuperAdminSession, SUPER_ADMIN_SESSION_COOKIE } from '@/lib/super-admin-auth'

export default async function Home() {
  const token = (await cookies()).get(SUPER_ADMIN_SESSION_COOKIE)?.value

  if (isValidSuperAdminSession(token)) {
    redirect('/admin')
  }

  return (
    <main className="flex min-h-screen w-full">
      <BrandPanel />
      <LoginForm />
    </main>
  )
}
