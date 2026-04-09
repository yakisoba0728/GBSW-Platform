import { describe, expect, it, vi } from 'vitest'
import {
  createMethodProxyHandler,
  createParamMethodProxyHandler,
  createParamProxyHandler,
  createStaticProxyHandler,
} from './api-route-handlers'

describe('api-route-handlers', () => {
  it('builds static proxy handlers', async () => {
    const response = new Response(null, { status: 204 })
    const proxy = vi.fn().mockResolvedValue(response)
    const request = {} as never
    const handler = createStaticProxyHandler(proxy, '/admin/teachers')

    const result = await handler(request)

    expect(result).toBe(response)
    expect(proxy).toHaveBeenCalledWith(request, '/admin/teachers')
  })

  it('builds method proxy handlers', async () => {
    const response = new Response(null, { status: 204 })
    const proxy = vi.fn().mockResolvedValue(response)
    const request = {} as never
    const handler = createMethodProxyHandler(
      proxy,
      '/school-mileage/entries/batch',
      'POST',
    )

    const result = await handler(request)

    expect(result).toBe(response)
    expect(proxy).toHaveBeenCalledWith(
      request,
      '/school-mileage/entries/batch',
      'POST',
    )
  })

  it('encodes params for static proxy handlers', async () => {
    const response = new Response(null, { status: 204 })
    const proxy = vi.fn().mockResolvedValue(response)
    const request = {} as never
    const handler = createParamProxyHandler(
      'studentId',
      (studentId) => `/school-mileage/students/${studentId}/summary`,
      proxy,
    )

    const result = await handler(request, {
      params: Promise.resolve({ studentId: 'A B/C' }),
    })

    expect(result).toBe(response)
    expect(proxy).toHaveBeenCalledWith(
      request,
      '/school-mileage/students/A%20B%2FC/summary',
    )
  })

  it('encodes params for method proxy handlers', async () => {
    const response = new Response(null, { status: 204 })
    const proxy = vi.fn().mockResolvedValue(response)
    const request = {} as never
    const handler = createParamMethodProxyHandler(
      'id',
      (id) => `/admin/teachers/${id}/status`,
      proxy,
      'PATCH',
    )

    const result = await handler(request, {
      params: Promise.resolve({ id: 'teacher/01' }),
    })

    expect(result).toBe(response)
    expect(proxy).toHaveBeenCalledWith(
      request,
      '/admin/teachers/teacher%2F01/status',
      'PATCH',
    )
  })
})
