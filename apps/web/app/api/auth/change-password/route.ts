import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getApiBaseUrl } from '@/lib/api-base-url'
import {
  AUTH_SESSION_COOKIE,
  createAuthSessionToken,
  getDefaultRedirectPathForRole,
  getSessionCookieMaxAge,
  readAuthSession,
  shouldUseSecureCookie,
} from '@/lib/auth-session'

export async function POST(request: NextRequest) {
  const token = (await cookies()).get(AUTH_SESSION_COOKIE)?.value
  const session = readAuthSession(token)

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

  const body = await request.json().catch(() => null)
  const currentPassword =
    typeof body?.currentPassword === 'string' ? body.currentPassword : undefined
  const newPassword =
    typeof body?.newPassword === 'string' ? body.newPassword : ''

  try {
    const upstreamResponse = await fetch(`${getApiBaseUrl()}/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountId: session.accountId,
        role: session.role,
        currentPassword,
        newPassword,
        allowMissingCurrentPassword: session.mustChangePassword,
      }),
      cache: 'no-store',
    })

    const payload = await upstreamResponse.json().catch(() => null)

    if (!upstreamResponse.ok) {
      return NextResponse.json(
        { message: getErrorMessage(payload, '비밀번호를 변경하지 못했습니다.') },
        { status: upstreamResponse.status },
      )
    }

    const response = NextResponse.json({
      ok: true,
      redirectTo: getDefaultRedirectPathForRole(session.role),
    })

    response.cookies.set({
      name: AUTH_SESSION_COOKIE,
      value: createAuthSessionToken({
        accountId: session.accountId,
        role: session.role,
        mustChangePassword: false,
      }),
      httpOnly: true,
      sameSite: 'lax',
      secure: shouldUseSecureCookie(request),
      path: '/',
      maxAge: getSessionCookieMaxAge(),
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
