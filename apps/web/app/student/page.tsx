import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import LogoutButton from '@/app/components/LogoutButton'
import {
  AUTH_SESSION_COOKIE,
  getRedirectPathForRole,
  readAuthSession,
} from '@/lib/auth-session'

export default async function StudentPage() {
  const token = (await cookies()).get(AUTH_SESSION_COOKIE)?.value
  const session = readAuthSession(token)

  if (!session) {
    redirect('/')
  }

  if (session.role !== 'student') {
    redirect(getRedirectPathForRole(session.role))
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-semibold">학생 페이지입니다.</h1>
      <p>정상적으로 로그인되었습니다.</p>
      <LogoutButton className="rounded-lg border px-4 py-2" />
    </main>
  )
}
