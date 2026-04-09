import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import {
  getResponseMessage,
  readJsonRequestBody,
  readResponseBody,
} from '@/lib/api-proxy'
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

  if (session.role === 'super-admin') {
    return NextResponse.json(
      { message: '최고관리자 비밀번호 변경은 지원하지 않습니다.' },
      { status: 400 },
    )
  }

  const bodyResult = await readJsonRequestBody(request)

  if (!bodyResult.ok) {
    return NextResponse.json(
      { message: '요청 본문이 올바르지 않습니다.' },
      { status: 400 },
    )
  }

  const body = bodyResult.body as Record<string, unknown> | null
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

    const responseBody = await readResponseBody(upstreamResponse)

    if (!upstreamResponse.ok) {
      return NextResponse.json(
        { message: getResponseMessage(responseBody, '비밀번호를 변경하지 못했습니다.') },
        { status: upstreamResponse.status },
      )
    }

    const payload =
      responseBody.kind === 'json'
        ? (responseBody.body as Record<string, unknown> | null)
        : null
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

function parseAuthSession(value: unknown): {
  id: string
  accountId: string
  role: 'student' | 'teacher'
  mustChangePassword: boolean
  hasLinkedEmail: boolean
  hasLinkedPhone: boolean
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
    (session.role !== 'student' && session.role !== 'teacher') ||
    typeof session.mustChangePassword !== 'boolean' ||
    typeof session.hasLinkedEmail !== 'boolean' ||
    typeof session.hasLinkedPhone !== 'boolean' ||
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
    hasLinkedEmail: session.hasLinkedEmail,
    hasLinkedPhone: session.hasLinkedPhone,
    expiresAt: session.expiresAt,
    ...(session.school ? { school: session.school } : {}),
  }
}
