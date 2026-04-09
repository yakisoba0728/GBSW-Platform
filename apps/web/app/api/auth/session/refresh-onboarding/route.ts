import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { getApiBaseUrl } from '@/lib/api-base-url'
import {
  getResponseMessage,
  readResponseBody,
} from '@/lib/api-proxy'
import {
  AUTH_SESSION_COOKIE,
  readAuthSessionId,
  resolveAuthSession,
} from '@/lib/auth-session'
import { getInternalApiSecret } from '@/lib/runtime-env'

export async function POST() {
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

  try {
    const upstreamResponse = await fetch(
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

    const responseBody = await readResponseBody(upstreamResponse)

    if (!upstreamResponse.ok) {
      return NextResponse.json(
        { message: getResponseMessage(responseBody, '세션 갱신에 실패했습니다.') },
        { status: upstreamResponse.status },
      )
    }

    const payload =
      responseBody.kind === 'json'
        ? (responseBody.body as Record<string, unknown> | null)
        : null

    return NextResponse.json({ ok: true, session: payload?.session ?? null })
  } catch {
    return NextResponse.json({ message: '세션 갱신 요청을 처리하지 못했습니다.' }, { status: 502 })
  }
}
