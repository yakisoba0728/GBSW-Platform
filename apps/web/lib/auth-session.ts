import { createHmac, timingSafeEqual } from 'node:crypto'
import type { NextRequest } from 'next/server'
import {
  getAuthSessionSecret,
  getSuperAdminCredentials,
} from './runtime-env'

export type AuthRole = 'super-admin' | 'student' | 'teacher'

export type AuthSession = {
  version: number
  accountId: string
  role: AuthRole
  mustChangePassword: boolean
  iat: number
  exp: number
}

type AuthSessionTokenInput = {
  accountId: string
  role: AuthRole
  mustChangePassword: boolean
  iat?: number
  exp?: number
}

export const AUTH_SESSION_COOKIE = 'gbsw-auth-session'

const SESSION_VERSION = 1
const SESSION_DURATION_SECONDS = 60 * 60 * 8

export function isValidSuperAdminLogin(id: string, password: string) {
  const credentials = getSuperAdminCredentials()

  return (
    safeEqual(id, credentials.id) &&
    safeEqual(password, credentials.password)
  )
}

export function createAuthSessionToken(session: AuthSessionTokenInput) {
  const issuedAt = getCurrentUnixTimestamp()
  const payload = Buffer.from(
    JSON.stringify({
      version: SESSION_VERSION,
      accountId: session.accountId,
      role: session.role,
      mustChangePassword: session.mustChangePassword,
      iat: session.iat ?? issuedAt,
      exp: session.exp ?? issuedAt + SESSION_DURATION_SECONDS,
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
    ) as Partial<AuthSession>

    if (
      parsed.version !== SESSION_VERSION ||
      !isAuthRole(parsed.role) ||
      typeof parsed.accountId !== 'string' ||
      parsed.accountId.trim().length === 0 ||
      typeof parsed.mustChangePassword !== 'boolean' ||
      !isValidUnixTimestamp(parsed.iat) ||
      !isValidUnixTimestamp(parsed.exp) ||
      parsed.exp <= parsed.iat ||
      parsed.exp <= getCurrentUnixTimestamp()
    ) {
      return null
    }

    return {
      version: SESSION_VERSION,
      accountId: parsed.accountId.trim(),
      role: parsed.role,
      mustChangePassword: parsed.mustChangePassword,
      iat: parsed.iat,
      exp: parsed.exp,
    } satisfies AuthSession
  } catch {
    return null
  }
}

export function isAuthRole(value: unknown): value is AuthRole {
  return value === 'super-admin' || value === 'student' || value === 'teacher'
}

export function getDefaultRedirectPathForRole(role: AuthRole) {
  switch (role) {
    case 'super-admin':
      return '/admin'
    case 'student':
      return '/'
    case 'teacher':
      return '/'
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

export function getSessionCookieMaxAge() {
  return SESSION_DURATION_SECONDS
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
  return createHmac('sha256', getAuthSessionSecret())
    .update(payload)
    .digest('hex')
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  if (leftBuffer.length !== rightBuffer.length) {
    return false
  }

  return timingSafeEqual(leftBuffer, rightBuffer)
}

function getCurrentUnixTimestamp() {
  return Math.floor(Date.now() / 1000)
}

function isValidUnixTimestamp(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}
