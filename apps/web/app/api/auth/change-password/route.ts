import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getApiBaseUrl } from '@/lib/api-base-url'
import {
  AUTH_SESSION_COOKIE,
  getDefaultRedirectPathForRole,
  getSessionCookieMaxAge,
  readAuthSessionId,
  resolveAuthSession,
  shouldUseSecureCookie,
} from '@/lib/auth-session'
import { getInternalApiSecret } from '@/lib/runtime-env'

export async function POST(request: NextRequest) {
  const sessionId = readAuthSessionId(
    (await cookies()).get(AUTH_SESSION_COOKIE)?.value,
  )
  let session: Awaited<ReturnType<typeof resolveAuthSession>>

  try {
    session = await resolveAuthSession(sessionId)
  } catch {
    return NextResponse.json(
      { message: '세션 정보를 확인하지 못했습니다.' },
      { status: 502 },
    )
  }

  if (!session) {
    return NextResponse.json(
      { message: '로그인이 필요합니다.' },
      { status: 401 },
    )
  }

  const body = await request.json().catch(() => null)
  const currentPassword =
    typeof body?.currentPassword === 'string' ? body.currentPassword : undefined
  const newPassword =
    typeof body?.newPassword === 'string' ? body.newPassword : ''

  try {
    const upstreamResponse = await fetch(
      `${getApiBaseUrl()}/auth/change-password`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-api-secret': getInternalApiSecret(),
          'x-actor-session-id': session.id,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
        cache: 'no-store',
      },
    )

    const payload = await upstreamResponse.json().catch(() => null)

    if (!upstreamResponse.ok) {
      return NextResponse.json(
        { message: getErrorMessage(payload, '비밀번호를 변경하지 못했습니다.') },
        { status: upstreamResponse.status },
      )
    }

    const nextSession = parseAuthSession(payload?.session)

    if (!nextSession) {
      return NextResponse.json(
        { message: '비밀번호 변경 응답이 올바르지 않습니다.' },
        { status: 502 },
      )
    }

    const response = NextResponse.json({
      ok: true,
      redirectTo: getDefaultRedirectPathForRole(nextSession.role),
    })

    response.cookies.set({
      name: AUTH_SESSION_COOKIE,
      value: nextSession.id,
      httpOnly: true,
      sameSite: 'lax',
      secure: shouldUseSecureCookie(request),
      path: '/',
      maxAge: getSessionCookieMaxAge(nextSession.expiresAt),
    })

    return response
  } catch {
    return NextResponse.json(
      { message: '비밀번호 변경 요청을 처리하지 못했습니다.' },
      { status: 502 },
    )
  }
}

function getErrorMessage(payload: unknown, fallback: string) {
  if (
    payload &&
    typeof payload === 'object' &&
    'message' in payload &&
    typeof payload.message === 'string' &&
    payload.message.trim().length > 0
  ) {
    return payload.message.trim()
  }

  return fallback
}

function parseAuthSession(value: unknown): {
  id: string
  accountId: string
  role: 'super-admin' | 'student' | 'teacher'
  mustChangePassword: boolean
  expiresAt: string
  school?: 'GBSW' | 'BYMS'
} | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const session = value as Record<string, unknown>

  if (
    typeof session.id !== 'string' ||
    session.id.trim().length === 0 ||
    typeof session.accountId !== 'string' ||
    session.accountId.trim().length === 0 ||
    (session.role !== 'super-admin' &&
      session.role !== 'student' &&
      session.role !== 'teacher') ||
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
    expiresAt: session.expiresAt,
    ...(session.school ? { school: session.school } : {}),
  }
}
