import { NextRequest, NextResponse } from 'next/server'
import {
  getResponseMessage,
  readJsonRequestBody,
  readResponseBody,
} from '@/lib/api-proxy'
import {
  AUTH_SESSION_COOKIE,
  getRedirectPathForSession,
  getSessionCookieMaxAge,
  shouldUseSecureCookie,
} from '@/lib/auth-session'
import { getApiBaseUrl } from '@/lib/api-base-url'

export async function POST(request: NextRequest) {
  const bodyResult = await readJsonRequestBody(request)

  if (!bodyResult.ok) {
    return NextResponse.json(
      { message: '요청 본문이 올바르지 않습니다.' },
      { status: 400 },
    )
  }

  const body = bodyResult.body as Record<string, unknown> | null
  const id = typeof body?.id === 'string' ? body.id.trim() : ''
  const password = typeof body?.password === 'string' ? body.password : ''

  if (!id || !password) {
    return NextResponse.json(
      { message: '아이디와 비밀번호를 입력해주세요.' },
      { status: 400 },
    )
  }

  try {
    const realIp = forwardHeaderValue('x-real-ip', request)
    const xForwardedFor = forwardHeaderValue('x-forwarded-for', request)
    const upstreamResponse = await fetch(`${getApiBaseUrl()}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(realIp && {
          'x-real-ip': realIp,
        }),
        ...(xForwardedFor && {
          'x-forwarded-for': xForwardedFor,
        }),
      },
      body: JSON.stringify({ id, password }),
      cache: 'no-store',
    })

    const responseBody = await readResponseBody(upstreamResponse)

    if (!upstreamResponse.ok) {
      return NextResponse.json(
        { message: getResponseMessage(responseBody, '로그인에 실패했습니다.') },
        { status: upstreamResponse.status },
      )
    }

    const payload =
      responseBody.kind === 'json'
        ? (responseBody.body as Record<string, unknown> | null)
        : null
    const session = parseAuthSession(payload?.session)

    if (!session) {
      return NextResponse.json(
        { message: '로그인 응답이 올바르지 않습니다.' },
        { status: 502 },
      )
    }

    const response = NextResponse.json({
      ok: true,
      redirectTo: getRedirectPathForSession(session),
    })

    response.cookies.set({
      name: AUTH_SESSION_COOKIE,
      value: session.id,
      httpOnly: true,
      sameSite: 'lax',
      secure: shouldUseSecureCookie(request),
      path: '/',
      maxAge: getSessionCookieMaxAge(session.expiresAt),
    })

    return response
  } catch {
    return NextResponse.json(
      { message: '로그인 요청을 처리하지 못했습니다.' },
      { status: 502 },
    )
  }
}

function forwardHeaderValue(name: 'x-real-ip' | 'x-forwarded-for', request: NextRequest) {
  const value = request.headers.get(name)?.trim()

  return value && value.length > 0 ? value : null
}

function parseAuthSession(value: unknown): {
  id: string
  accountId: string
  role: 'super-admin' | 'student' | 'teacher'
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
    (session.role !== 'super-admin' &&
      session.role !== 'student' &&
      session.role !== 'teacher') ||
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
