import { redirect } from 'next/navigation'
import { getRedirectPathForSession } from '@/lib/auth-session'
import { getServerAuthSession } from '@/lib/route-guards'

export default async function ChangePasswordPage() {
  const session = await getServerAuthSession()

  if (!session) {
    redirect('/')
  }

  redirect(getRedirectPathForSession(session))
}
