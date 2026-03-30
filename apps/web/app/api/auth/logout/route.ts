import { NextRequest, NextResponse } from 'next/server'
import {
  SUPER_ADMIN_SESSION_COOKIE,
  shouldUseSecureCookie,
} from '@/lib/super-admin-auth'

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: true })

  response.cookies.set({
    name: SUPER_ADMIN_SESSION_COOKIE,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: shouldUseSecureCookie(request),
    path: '/',
    maxAge: 0,
  })

  return response
}
