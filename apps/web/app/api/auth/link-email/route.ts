import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getApiBaseUrl } from '@/lib/api-base-url'
import {
  AUTH_SESSION_COOKIE,
  getSessionCookieMaxAge,
  readAuthSessionId,
  resolveAuthSession,
  shouldUseSecureCookie,
} from '@/lib/auth-session'
import { getInternalApiSecret } from '@/lib/runtime-env'

export async function PATCH(request: NextRequest) {
  const sessionId = readAuthSessionId((await cookies()).get(AUTH_SESSION_COOKIE)?.value)
  let session: Awaited<ReturnType<typeof resolveAuthSession>>

  try {
    session = await resolveAuthSession(sessionId)
  } catch {
    return NextResponse.json({ message: '세션 정보를 확인하지 못했습니다.' }, { status: 502 })
  }

  if (!session) {
    return NextResponse.json({ message: '로그인이 필요합니다.' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)

  try {
    const upstreamResponse = await fetch(`${getApiBaseUrl()}/auth/link-email`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-internal-api-secret': getInternalApiSecret(),
        'x-actor-session-id': session.id,
      },
      body: JSON.stringify(body ?? {}),
      cache: 'no-store',
    })

    const payload = await upstreamResponse.json().catch(() => null)

    if (!upstreamResponse.ok) {
      return NextResponse.json(
        { message: payload?.message ?? '이메일 연동에 실패했습니다.' },
        { status: upstreamResponse.status },
      )
    }

    const refreshResponse = await fetch(
      `${getApiBaseUrl()}/auth/sessions/refresh-onboarding`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-api-secret': getInternalApiSecret(),
          'x-actor-session-id': session.id,
        },
        cache: 'no-store',
      },
    )

    const refreshPayload = await refreshResponse.json().catch(() => null)

    const response = NextResponse.json({ ok: true })

    if (refreshResponse.ok) {
      const refreshedSession = refreshPayload?.session
      if (
        refreshedSession &&
        typeof refreshedSession.id === 'string' &&
        typeof refreshedSession.expiresAt === 'string'
      ) {
        response.cookies.set({
          name: AUTH_SESSION_COOKIE,
          value: refreshedSession.id,
          httpOnly: true,
          sameSite: 'lax',
          secure: shouldUseSecureCookie(request),
          path: '/',
          maxAge: getSessionCookieMaxAge(refreshedSession.expiresAt),
        })
      }
    }

    return response
  } catch {
    return NextResponse.json({ message: '이메일 연동 요청을 처리하지 못했습니다.' }, { status: 502 })
  }
}
