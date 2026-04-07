import { cache } from 'react'
import type { NextRequest } from 'next/server'
import { getApiBaseUrl } from './api-base-url'
import { getInternalApiSecret } from './runtime-env'

export type AuthRole = 'super-admin' | 'student' | 'teacher'

export type AuthSession = {
  id: string
  accountId: string
  role: AuthRole
  mustChangePassword: boolean
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

export const resolveAuthSession = cache(
  async (sessionId: string | null | undefined): Promise<AuthSession | null> => {
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
  },
)

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
      return '/admin/students/create'
    case 'student':
      return '/student'
    case 'teacher':
      return '/teacher'
  }
}

export function getRedirectPathForSession(
  session: Pick<AuthSession, 'role' | 'mustChangePassword'>,
) {
  if (session.role !== 'super-admin' && session.mustChangePassword) {
    return '/change-password'
  }

  return getDefaultRedirectPathForRole(session.role)
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
    expiresAt: new Date(expiresAtMs).toISOString(),
    ...(session.school ? { school: session.school } : {}),
  } satisfies AuthSession
}
