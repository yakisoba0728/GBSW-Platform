import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  AUTH_SESSION_COOKIE,
  type AuthRole,
  type AuthSession,
  getDefaultRedirectPathForRole,
  getRedirectPathForSession,
  readAuthSessionId,
  resolveAuthSession,
} from './auth-session'

export async function getServerAuthSession() {
  const sessionId = readAuthSessionId(
    (await cookies()).get(AUTH_SESSION_COOKIE)?.value,
  )

  return resolveAuthSession(sessionId)
}

export async function redirectAuthenticatedSession() {
  const session = await getServerAuthSession()

  if (session) {
    redirect(getRedirectPathForSession(session))
  }
}

export async function requireRoleSession(expectedRole: AuthRole) {
  const session = await getServerAuthSession()

  if (!session) {
    redirect('/')
  }

  if (session.role !== expectedRole) {
    redirect(getRedirectPathForSession(session))
  }

  if (session.role !== 'super-admin' && session.mustChangePassword) {
    redirect('/change-password')
  }

  return session
}

export async function requireChangePasswordSession() {
  const session = await getServerAuthSession()

  if (!session) {
    redirect('/')
  }

  if (session.role === 'super-admin') {
    redirect(getDefaultRedirectPathForRole(session.role))
  }

  if (!session.mustChangePassword) {
    redirect(getDefaultRedirectPathForRole(session.role))
  }

  return session as AuthSession & { role: 'student' | 'teacher' }
}
