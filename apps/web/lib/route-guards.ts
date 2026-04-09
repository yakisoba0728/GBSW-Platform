import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  AUTH_SESSION_COOKIE,
  type AuthRole,
  type AuthSession,
  getRedirectPathForSession,
  getOnboardingStepRedirectPath,
  readAuthSessionId,
  resolveAuthSession,
  type OnboardingStep,
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

  if (session.role !== 'super-admin') {
    if (session.mustChangePassword) {
      redirect('/onboarding/change-password')
    }
  }

  return session
}

export async function requireOnboardingSession(step: OnboardingStep) {
  const session = await getServerAuthSession()

  if (!session || session.role === 'super-admin') {
    redirect('/')
  }

  const redirectPath = getOnboardingStepRedirectPath(session, step)

  if (redirectPath) {
    redirect(redirectPath)
  }

  return session as AuthSession & { role: 'student' | 'teacher' }
}

export async function requireChangePasswordSession() {
  return requireOnboardingSession('change-password')
}
