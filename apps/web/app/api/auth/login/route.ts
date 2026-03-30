import { NextRequest, NextResponse } from 'next/server'
import {
  AUTH_SESSION_COOKIE,
  createAuthSessionToken,
  getRedirectPathForRole,
  isAuthRole,
  isValidSuperAdminLogin,
  shouldUseSecureCookie,
} from '@/lib/auth-session'
import { getApiBaseUrl } from '@/lib/api-base-url'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const id = typeof body?.id === 'string' ? body.id.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!id || !password) {
    return NextResponse.json(
      { message: '아이디와 비밀번호를 입력해주세요.' },
      { status: 400 },
    )
  }

  let accountId = id
  let role: 'super-admin' | 'student' | 'teacher' = 'super-admin'

  if (!isValidSuperAdminLogin(id, password)) {
    try {
      const upstreamResponse = await fetch(`${getApiBaseUrl()}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, password }),
        cache: 'no-store',
      })

      const payload = await upstreamResponse.json().catch(() => null)

      if (!upstreamResponse.ok) {
        return NextResponse.json(
          { message: getErrorMessage(payload, '로그인에 실패했습니다.') },
          { status: upstreamResponse.status },
        )
      }

      const user = payload?.user

      if (
        !user ||
        !isAuthRole(user.role) ||
        user.role === 'super-admin' ||
        typeof user.accountId !== 'string' ||
        user.accountId.trim().length === 0
      ) {
        return NextResponse.json(
          { message: '로그인 응답이 올바르지 않습니다.' },
          { status: 502 },
        )
      }

      role = user.role
      accountId = user.accountId.trim()
    } catch {
      return NextResponse.json(
        { message: '로그인 요청을 처리하지 못했습니다.' },
        { status: 502 },
      )
    }
  }

  const response = NextResponse.json({
    ok: true,
    redirectTo: getRedirectPathForRole(role),
  })

  response.cookies.set({
    name: AUTH_SESSION_COOKIE,
    value: createAuthSessionToken({
      accountId,
      role,
    }),
    httpOnly: true,
    sameSite: 'lax',
    secure: shouldUseSecureCookie(request),
    path: '/',
    maxAge: 60 * 60 * 8,
  })

  return response
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
