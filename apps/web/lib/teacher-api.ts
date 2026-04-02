import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getApiBaseUrl } from './api-base-url'
import { getInternalApiSecret } from './runtime-env'
import { AUTH_SESSION_COOKIE, readAuthSession } from './auth-session'

type TeacherPath =
  | '/school-mileage/rules'
  | '/school-mileage/students'
  | '/school-mileage/entries'
  | '/school-mileage/entries/batch'
  | `/school-mileage/entries/${string}`

export async function proxyTeacherGetRequest(
  request: NextRequest,
  pathname: TeacherPath,
) {
  return proxyTeacherRequest(request, pathname, 'GET')
}

export async function proxyTeacherWriteRequest(
  request: NextRequest,
  pathname: TeacherPath,
  method: 'POST' | 'PATCH' | 'DELETE',
) {
  return proxyTeacherRequest(request, pathname, method)
}

async function proxyTeacherRequest(
  request: NextRequest,
  pathname: TeacherPath,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
) {
  const token = (await cookies()).get(AUTH_SESSION_COOKIE)?.value
  const session = readAuthSession(token)

  if (!session || session.role !== 'teacher') {
    return NextResponse.json(
      { message: '교사 로그인이 필요합니다.' },
      { status: 401 },
    )
  }

  const upstreamUrl = new URL(`${getApiBaseUrl()}${pathname}`)

  request.nextUrl.searchParams.forEach((value, key) => {
    upstreamUrl.searchParams.append(key, value)
  })

  const body =
    method === 'POST' || method === 'PATCH'
      ? await request.json().catch(() => null)
      : undefined

  try {
    const response = await fetch(upstreamUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-internal-api-secret': getInternalApiSecret(),
        'x-actor-teacher-id': session.accountId,
      },
      body:
        method === 'POST' || method === 'PATCH'
          ? JSON.stringify(body ?? {})
          : undefined,
      cache: 'no-store',
    })

    const payload = await response.json().catch(() => null)

    return NextResponse.json(
      payload ?? { message: '서버 응답을 처리하지 못했습니다.' },
      { status: response.status },
    )
  } catch {
    return NextResponse.json(
      { message: '학교 상벌점 요청을 처리하지 못했습니다.' },
      { status: 502 },
    )
  }
}
