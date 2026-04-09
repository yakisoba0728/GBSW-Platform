import { describe, expect, it } from 'vitest'
import {
  getDefaultRedirectPathForRole,
  getRedirectPathForSession,
  readAuthSessionId,
} from './auth-session'

describe('auth-session helpers', () => {
  it('builds role-aware redirect paths', () => {
    expect(getDefaultRedirectPathForRole('super-admin')).toBe('/admin/students/create')
    expect(getDefaultRedirectPathForRole('student')).toBe('/student')
    expect(getDefaultRedirectPathForRole('teacher')).toBe('/teacher')
  })

  it('sends first-login student and teacher sessions to the password page', () => {
    expect(
      getRedirectPathForSession({
        role: 'student',
        mustChangePassword: true,
      }),
    ).toBe('/change-password')
    expect(
      getRedirectPathForSession({
        role: 'teacher',
        mustChangePassword: true,
      }),
    ).toBe('/change-password')
  })

  it('keeps super admins out of the password-change route', () => {
    expect(
      getRedirectPathForSession({
        role: 'super-admin',
        mustChangePassword: false,
      }),
    ).toBe('/admin/students/create')
  })

  it('normalizes blank session ids to null', () => {
    expect(readAuthSessionId('   ')).toBeNull()
    expect(readAuthSessionId(' session-id ')).toBe('session-id')
  })
})
