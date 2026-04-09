import { afterEach, describe, expect, it } from 'vitest'
import { getApiBaseUrl, resolveApiBaseUrl } from './api-base-url'

const originalEnv = {
  API_INTERNAL_URL: process.env.API_INTERNAL_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  API_PORT: process.env.API_PORT,
}

afterEach(() => {
  process.env.API_INTERNAL_URL = originalEnv.API_INTERNAL_URL
  process.env.NEXT_PUBLIC_API_URL = originalEnv.NEXT_PUBLIC_API_URL
  process.env.API_PORT = originalEnv.API_PORT
})

describe('resolveApiBaseUrl', () => {
  it('normalizes a direct API origin', () => {
    expect(resolveApiBaseUrl('https://api.example.com/', 'NEXT_PUBLIC_API_URL')).toBe(
      'https://api.example.com',
    )
  })

  it('rejects URLs that include a path', () => {
    expect(() =>
      resolveApiBaseUrl('https://example.com/api', 'NEXT_PUBLIC_API_URL'),
    ).toThrow('cannot include the path "/api"')
  })
})

describe('getApiBaseUrl', () => {
  it('prefers API_INTERNAL_URL over NEXT_PUBLIC_API_URL', () => {
    process.env.API_INTERNAL_URL = 'http://api:3001'
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com'

    expect(getApiBaseUrl()).toBe('http://api:3001')
  })

  it('falls back to the local API port when no explicit URL is set', () => {
    delete process.env.API_INTERNAL_URL
    delete process.env.NEXT_PUBLIC_API_URL
    process.env.API_PORT = '4010'

    expect(getApiBaseUrl()).toBe('http://127.0.0.1:4010')
  })
})
