import { createHmac, timingSafeEqual } from 'node:crypto'
import type { NextRequest } from 'next/server'

export const SUPER_ADMIN_SESSION_COOKIE = 'gbsw-super-admin-session'

const SESSION_PAYLOAD = 'super-admin'

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

export function createSuperAdminSessionToken() {
  const credentials = getSuperAdminCredentials()
  const signature = createHmac('sha256', `${credentials.id}:${credentials.password}`)
    .update(SESSION_PAYLOAD)
    .digest('hex')

  return `${SESSION_PAYLOAD}.${signature}`
}

export function isValidSuperAdminSession(token?: string) {
  if (!token) {
    return false
  }

  return safeEqual(token, createSuperAdminSessionToken())
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

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  if (leftBuffer.length !== rightBuffer.length) {
    return false
  }

  return timingSafeEqual(leftBuffer, rightBuffer)
}
