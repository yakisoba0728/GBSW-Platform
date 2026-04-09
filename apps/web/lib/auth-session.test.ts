import { describe, expect, it } from 'vitest'
import {
  getDefaultRedirectPathForRole,
  getOnboardingEntryPath,
  getRedirectPathForSession,
  readAuthSessionId,
} from './auth-session'

describe('auth-session helpers', () => {
  it('builds role-aware redirect paths', () => {
    expect(getDefaultRedirectPathForRole('super-admin')).toBe('/admin/teachers')
    expect(getDefaultRedirectPathForRole('student')).toBe('/student')
    expect(getDefaultRedirectPathForRole('teacher')).toBe('/teacher')
  })

  it('sends first-login student and teacher sessions to the password page', () => {
    expect(
      getRedirectPathForSession({
        role: 'student',
        mustChangePassword: true,
        hasLinkedEmail: false,
        hasLinkedPhone: false,
      }),
    ).toBe('/onboarding/change-password')
    expect(
      getRedirectPathForSession({
        role: 'teacher',
        mustChangePassword: true,
        hasLinkedEmail: false,
        hasLinkedPhone: false,
      }),
    ).toBe('/onboarding/change-password')
  })

  it('sends sessions with no linked email to the link-email onboarding page', () => {
    expect(
      getRedirectPathForSession({
        role: 'student',
        mustChangePassword: false,
        hasLinkedEmail: false,
        hasLinkedPhone: false,
      }),
    ).toBe('/onboarding/link-email')
  })

  it('sends sessions with no linked phone to the link-phone onboarding page', () => {
    expect(
      getRedirectPathForSession({
        role: 'student',
        mustChangePassword: false,
        hasLinkedEmail: true,
        hasLinkedPhone: false,
      }),
    ).toBe('/onboarding/link-phone')
  })

  it('sends fully onboarded sessions to their role default path', () => {
    expect(
      getRedirectPathForSession({
        role: 'student',
        mustChangePassword: false,
        hasLinkedEmail: true,
        hasLinkedPhone: true,
      }),
    ).toBe('/student')
    expect(
      getRedirectPathForSession({
        role: 'teacher',
        mustChangePassword: false,
        hasLinkedEmail: true,
        hasLinkedPhone: true,
      }),
    ).toBe('/teacher')
  })

  it('keeps super admins out of the password-change route', () => {
    expect(
      getRedirectPathForSession({
        role: 'super-admin',
        mustChangePassword: false,
        hasLinkedEmail: false,
        hasLinkedPhone: false,
      }),
    ).toBe('/admin/teachers')
  })

  it('normalizes blank session ids to null', () => {
    expect(readAuthSessionId('   ')).toBeNull()
    expect(readAuthSessionId(' session-id ')).toBe('session-id')
  })
})

describe('getOnboardingEntryPath', () => {
  it('returns change-password path when mustChangePassword is true', () => {
    expect(
      getOnboardingEntryPath({
        mustChangePassword: true,
        hasLinkedEmail: false,
        hasLinkedPhone: false,
      }),
    ).toBe('/onboarding/change-password')
  })

  it('returns null when all onboarding steps are complete', () => {
    expect(
      getOnboardingEntryPath({
        mustChangePassword: false,
        hasLinkedEmail: true,
        hasLinkedPhone: true,
      }),
    ).toBeNull()
  })

  it('returns null when mustChangePassword is false regardless of links', () => {
    expect(
      getOnboardingEntryPath({
        mustChangePassword: false,
        hasLinkedEmail: false,
        hasLinkedPhone: false,
      }),
    ).toBeNull()
  })
})
