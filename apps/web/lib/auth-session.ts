import type { NextRequest } from 'next/server'
import { getApiBaseUrl } from './api-base-url'
import { getInternalApiSecret } from './runtime-env'

export type AuthRole = 'super-admin' | 'student' | 'teacher'
export type OnboardingStep = 'change-password' | 'link-email' | 'link-phone'

export type AuthSession = {
  id: string
  accountId: string
  role: AuthRole
  mustChangePassword: boolean
  hasLinkedEmail: boolean
  hasLinkedPhone: boolean
  expiresAt: string
  school?: 'GBSW' | 'BYMS'
}

export const AUTH_SESSION_COOKIE = 'gbsw-auth-session'

export class AuthSessionLookupError extends Error {
  constructor(message = '세션 정보를 확인하지 못했습니다.') {
    super(message)
    this.name = 'AuthSessionLookupError'
  }
}

export async function resolveAuthSession(
  sessionId: string | null | undefined,
): Promise<AuthSession | null> {
  const normalizedSessionId = readAuthSessionId(sessionId)

  if (!normalizedSessionId) {
    return null
  }

  let response: Response

  try {
    response = await fetch(`${getApiBaseUrl()}/auth/sessions/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-api-secret': getInternalApiSecret(),
      },
      body: JSON.stringify({ sessionId: normalizedSessionId }),
      cache: 'no-store',
    })
  } catch {
    throw new AuthSessionLookupError()
  }

  if (!response.ok) {
    throw new AuthSessionLookupError()
  }

  const payload = await response.json().catch(() => undefined)

  if (!payload || typeof payload !== 'object') {
    throw new AuthSessionLookupError('세션 조회 응답이 올바르지 않습니다.')
  }

  const parsedPayload = payload as {
    ok?: unknown
    session?: unknown
  }

  if (parsedPayload.ok === false) {
    return null
  }

  if (parsedPayload.ok !== true) {
    throw new AuthSessionLookupError('세션 조회 응답이 올바르지 않습니다.')
  }

  const session = parseAuthSession(parsedPayload.session)

  if (!session) {
    throw new AuthSessionLookupError('세션 조회 응답이 올바르지 않습니다.')
  }

  return session
}

export async function revokeAuthSession(sessionId: string) {
  const normalizedSessionId = readAuthSessionId(sessionId)

  if (!normalizedSessionId) {
    return
  }

  const response = await fetch(`${getApiBaseUrl()}/auth/sessions/revoke`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-api-secret': getInternalApiSecret(),
    },
    body: JSON.stringify({ sessionId: normalizedSessionId }),
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error('세션 종료 요청을 처리하지 못했습니다.')
  }
}

export function isAuthRole(value: unknown): value is AuthRole {
  return value === 'super-admin' || value === 'student' || value === 'teacher'
}

export function readAuthSessionId(token?: string | null) {
  const value = token?.trim()

  if (!value) {
    return null
  }

  return value
}

export function getDefaultRedirectPathForRole(role: AuthRole) {
  switch (role) {
    case 'super-admin':
      return '/admin/teachers'
    case 'student':
      return '/student'
    case 'teacher':
      return '/teacher'
  }
}

export function getOnboardingEntryPath(
  session: Pick<AuthSession, 'mustChangePassword' | 'hasLinkedEmail' | 'hasLinkedPhone'>,
): string | null {
  if (session.mustChangePassword) return '/onboarding/change-password'
  return null
}

export function getRedirectPathForSession(
  session: Pick<AuthSession, 'role' | 'mustChangePassword' | 'hasLinkedEmail' | 'hasLinkedPhone'>,
) {
  if (session.role !== 'super-admin') {
    const onboardingPath = getOnboardingEntryPath(session)
    if (onboardingPath) return onboardingPath

    if (!session.hasLinkedEmail) return '/onboarding/link-email'
    if (!session.hasLinkedPhone) return '/onboarding/link-phone'
  }

  return getDefaultRedirectPathForRole(session.role)
}

export function getOnboardingStepRedirectPath(
  session: Pick<AuthSession, 'role' | 'mustChangePassword' | 'hasLinkedEmail' | 'hasLinkedPhone'>,
  step: OnboardingStep,
) {
  if (session.role === 'super-admin') {
    return getDefaultRedirectPathForRole(session.role)
  }

  const onboardingEntryPath = getOnboardingEntryPath(session)

  if (step === 'change-password') {
    return session.mustChangePassword
      ? null
      : onboardingEntryPath ?? getDefaultRedirectPathForRole(session.role)
  }

  if (step === 'link-email') {
    if (session.mustChangePassword) return '/onboarding/change-password'
    if (session.hasLinkedEmail) {
      return session.hasLinkedPhone
        ? getDefaultRedirectPathForRole(session.role)
        : '/onboarding/link-phone'
    }

    return null
  }

  if (session.mustChangePassword) {
    return '/onboarding/change-password'
  }

  return session.hasLinkedPhone
    ? getDefaultRedirectPathForRole(session.role)
    : null
}

export function getSessionCookieMaxAge(expiresAt: string | Date) {
  const expiresAtMs =
    expiresAt instanceof Date ? expiresAt.getTime() : Date.parse(expiresAt)

  if (!Number.isFinite(expiresAtMs)) {
    return 0
  }

  return Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000))
}

export function shouldUseSecureCookie(request: NextRequest) {
  const forwardedProto = request.headers.get('x-forwarded-proto')

  if (forwardedProto) {
    return forwardedProto === 'https'
  }

  const { hostname, protocol } = request.nextUrl

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return false
  }

  return protocol === 'https:'
}

function parseAuthSession(value: unknown) {
  if (!value || typeof value !== 'object') {
    return null
  }

  const session = value as Record<string, unknown>

  if (
    typeof session.id !== 'string' ||
    session.id.trim().length === 0 ||
    typeof session.accountId !== 'string' ||
    session.accountId.trim().length === 0 ||
    !isAuthRole(session.role) ||
    typeof session.mustChangePassword !== 'boolean' ||
    typeof session.expiresAt !== 'string'
  ) {
    return null
  }

  if (
    typeof session.hasLinkedEmail !== 'boolean' ||
    typeof session.hasLinkedPhone !== 'boolean'
  ) {
    return null
  }

  if (
    session.school !== undefined &&
    session.school !== 'GBSW' &&
    session.school !== 'BYMS'
  ) {
    return null
  }

  const expiresAtMs = Date.parse(session.expiresAt)

  if (!Number.isFinite(expiresAtMs) || expiresAtMs <= Date.now()) {
    return null
  }

  return {
    id: session.id.trim(),
    accountId: session.accountId.trim(),
    role: session.role,
    mustChangePassword: session.mustChangePassword,
    hasLinkedEmail: session.hasLinkedEmail,
    hasLinkedPhone: session.hasLinkedPhone,
    expiresAt: new Date(expiresAtMs).toISOString(),
    ...(session.school ? { school: session.school } : {}),
  } satisfies AuthSession
}
