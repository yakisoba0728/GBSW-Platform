import { createHmac, timingSafeEqual } from 'node:crypto'
import type { NextRequest } from 'next/server'

export type AuthRole = 'super-admin' | 'student' | 'teacher'

export type AuthSession = {
  accountId: string
  role: AuthRole
}

export const AUTH_SESSION_COOKIE = 'gbsw-auth-session'

const SESSION_VERSION = 1

export function getSuperAdminCredentials() {
  return {
    id: process.env.SUPER_ADMIN_ID ?? 'admin',
    password: process.env.SUPER_ADMIN_PASSWORD ?? 'admin1234',
  }
}

export function isValidSuperAdminLogin(id: string, password: string) {
  const credentials = getSuperAdminCredentials()

  return (
    safeEqual(id, credentials.id) &&
    safeEqual(password, credentials.password)
  )
}

export function createAuthSessionToken(session: AuthSession) {
  const payload = Buffer.from(
    JSON.stringify({
      accountId: session.accountId,
      role: session.role,
      version: SESSION_VERSION,
    }),
    'utf8',
  ).toString('base64url')

  return `${payload}.${sign(payload)}`
}

export function readAuthSession(token?: string) {
  if (!token) {
    return null
  }

  const [payload, signature, ...rest] = token.split('.')

  if (!payload || !signature || rest.length > 0) {
    return null
  }

  if (!safeEqual(signature, sign(payload))) {
    return null
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8'),
    ) as Partial<AuthSession> & { version?: number }

    if (
      parsed.version !== SESSION_VERSION ||
      !isAuthRole(parsed.role) ||
      typeof parsed.accountId !== 'string' ||
      parsed.accountId.trim().length === 0
    ) {
      return null
    }

    return {
      accountId: parsed.accountId.trim(),
      role: parsed.role,
    } satisfies AuthSession
  } catch {
    return null
  }
}

export function isAuthRole(value: unknown): value is AuthRole {
  return value === 'super-admin' || value === 'student' || value === 'teacher'
}

export function getRedirectPathForRole(role: AuthRole) {
  switch (role) {
    case 'super-admin':
      return '/admin'
    case 'student':
      return '/student'
    case 'teacher':
      return '/teacher'
  }
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

function sign(payload: string) {
  return createHmac('sha256', getSessionSigningKey())
    .update(payload)
    .digest('hex')
}

function getSessionSigningKey() {
  const sessionSecret = process.env.AUTH_SESSION_SECRET?.trim()

  if (sessionSecret) {
    return sessionSecret
  }

  const credentials = getSuperAdminCredentials()

  return `${credentials.id}:${credentials.password}`
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  if (leftBuffer.length !== rightBuffer.length) {
    return false
  }

  return timingSafeEqual(leftBuffer, rightBuffer)
}
