import { NextRequest, NextResponse } from 'next/server'
import {
  AUTH_SESSION_COOKIE,
  shouldUseSecureCookie,
} from '@/lib/auth-session'

export async function POST(request: NextRequest) {
  const response = NextResponse.json({ ok: true })

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
