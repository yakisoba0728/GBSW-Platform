import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import {
  SUPER_ADMIN_SESSION_COOKIE,
  isValidSuperAdminSession,
} from './super-admin-auth'

type AdminPath =
  | '/admin/students'
  | '/admin/teachers'
  | '/admin/students/major-subjects'

export async function proxyAdminCreateRequest(
  request: NextRequest,
  pathname: '/admin/students' | '/admin/teachers',
) {
  return proxyAdminRequest(request, pathname, 'POST')
}

export async function proxyAdminGetRequest(
  request: NextRequest,
  pathname: '/admin/students/major-subjects',
) {
  return proxyAdminRequest(request, pathname, 'GET')
}

async function proxyAdminRequest(
  request: NextRequest,
  pathname: AdminPath,
  method: 'GET' | 'POST',
) {
  const token = (await cookies()).get(SUPER_ADMIN_SESSION_COOKIE)?.value

  if (!isValidSuperAdminSession(token)) {
    return NextResponse.json(
      { message: '최고관리자 로그인이 필요합니다.' },
      { status: 401 },
    )
  }

  const body =
    method === 'POST' ? await request.json().catch(() => null) : undefined

  try {
    const response = await fetch(`${getApiBaseUrl()}${pathname}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-super-admin-id': process.env.SUPER_ADMIN_ID ?? 'admin',
        'x-super-admin-password':
          process.env.SUPER_ADMIN_PASSWORD ?? 'admin1234',
      },
      body: method === 'POST' ? JSON.stringify(body ?? {}) : undefined,
      cache: 'no-store',
    })

    const payload = await response.json().catch(() => null)

    return NextResponse.json(
      payload ?? { message: '서버 응답을 처리하지 못했습니다.' },
      { status: response.status },
    )
  } catch {
    return NextResponse.json(
      { message: '계정 생성 요청을 처리하지 못했습니다.' },
      { status: 502 },
    )
  }
}

function getApiBaseUrl() {
  const value =
    process.env.API_INTERNAL_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    `http://127.0.0.1:${process.env.API_PORT ?? '3001'}`

  return value.endsWith('/') ? value.slice(0, -1) : value
}
