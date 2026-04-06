import { NextRequest, NextResponse } from 'next/server'
import {
  AUTH_SESSION_COOKIE,
  readAuthSessionId,
  revokeAuthSession,
  shouldUseSecureCookie,
} from '@/lib/auth-session'

export async function POST(request: NextRequest) {
  const sessionId = readAuthSessionId(
    request.cookies.get(AUTH_SESSION_COOKIE)?.value,
  )

  if (sessionId) {
    try {
      await revokeAuthSession(sessionId)
    } catch {
      return createLogoutResponse(
        request,
        { message: '로그아웃 요청을 처리하지 못했습니다.' },
        502,
      )
    }
  }

  return createLogoutResponse(request, { ok: true })
}

function createLogoutResponse(
  request: NextRequest,
  body: { ok: true } | { message: string },
  status = 200,
) {
  const response = NextResponse.json(body, { status })

  response.cookies.set({
    name: AUTH_SESSION_COOKIE,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: shouldUseSecureCookie(request),
    path: '/',
    maxAge: 0,
  })

  return response
}
