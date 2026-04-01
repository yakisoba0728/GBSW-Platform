import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import BrandPanel from './components/BrandPanel'
import LoginForm from './components/LoginForm'
import StudentDashboard from './components/StudentDashboard'
import TeacherDashboard from './components/TeacherDashboard'
import {
  AUTH_SESSION_COOKIE,
  readAuthSession,
} from '@/lib/auth-session'

export default async function Home() {
  const token = (await cookies()).get(AUTH_SESSION_COOKIE)?.value
  const session = readAuthSession(token)

  if (session?.role === 'super-admin') {
    redirect('/admin')
  }

  if (!session) {
    return (
      <main className="flex min-h-screen w-full">
        <BrandPanel />
        <LoginForm />
      </main>
    )
  }

  if (session.mustChangePassword) {
    redirect('/change-password')
  }

  if (session.role === 'student') {
    return <StudentDashboard />
  }

  if (session.role === 'teacher') {
    return <TeacherDashboard />
  }

  redirect('/')
}
