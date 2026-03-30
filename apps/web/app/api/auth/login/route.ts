import { NextRequest, NextResponse } from 'next/server'
import {
  SUPER_ADMIN_SESSION_COOKIE,
  createSuperAdminSessionToken,
  isValidSuperAdminLogin,
  shouldUseSecureCookie,
} from '@/lib/super-admin-auth'

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

  if (!isValidSuperAdminLogin(id, password)) {
    return NextResponse.json(
      { message: '아이디 또는 비밀번호가 일치하지 않습니다.' },
      { status: 401 },
    )
  }

  const response = NextResponse.json({ ok: true })

  response.cookies.set({
    name: SUPER_ADMIN_SESSION_COOKIE,
    value: createSuperAdminSessionToken(),
    httpOnly: true,
    sameSite: 'lax',
    secure: shouldUseSecureCookie(request),
    path: '/',
    maxAge: 60 * 60 * 8,
  })

  return response
}
