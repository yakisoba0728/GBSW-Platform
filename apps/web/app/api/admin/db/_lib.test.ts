import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getServerAuthSession, proxyAdminDbGetRequest, proxyAdminDbWriteRequest } = vi.hoisted(
  () => ({
    getServerAuthSession: vi.fn(),
    proxyAdminDbGetRequest: vi.fn(),
    proxyAdminDbWriteRequest: vi.fn(),
  }),
)

vi.mock('@/lib/route-guards', () => ({
  getServerAuthSession,
}))

vi.mock('@/lib/admin-api', () => ({
  proxyAdminDbGetRequest,
  proxyAdminDbWriteRequest,
}))

import {
  ADMIN_DB_UNAUTHORIZED_MESSAGE,
  ensureAdminDbSuperAdminAccess,
  proxyAdminDbGetRequestWithGuard,
  proxyAdminDbWriteRequestWithGuard,
} from './_lib'

describe('admin db route guards', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('rejects non-super-admin sessions early', async () => {
    getServerAuthSession.mockResolvedValueOnce({ role: 'teacher' })

    const response = await ensureAdminDbSuperAdminAccess()

    expect(response?.status).toBe(401)
    await expect(response?.text()).resolves.toContain(ADMIN_DB_UNAUTHORIZED_MESSAGE)
    expect(ADMIN_DB_UNAUTHORIZED_MESSAGE).toContain('최고관리자')
  })

  it('allows the proxy when the session is super-admin', async () => {
    getServerAuthSession.mockResolvedValueOnce({ role: 'super-admin' })
    proxyAdminDbGetRequest.mockResolvedValueOnce(new Response('ok', { status: 200 }))

    const response = await proxyAdminDbGetRequestWithGuard(
      new Request('http://localhost/api/admin/db/tables') as never,
      '/admin/db/tables',
    )

    expect(proxyAdminDbGetRequest).toHaveBeenCalledTimes(1)
    expect(response.status).toBe(200)
  })

  it('blocks write requests before proxying when the session is absent', async () => {
    getServerAuthSession.mockResolvedValueOnce(null)

    const response = await proxyAdminDbWriteRequestWithGuard(
      new Request('http://localhost/api/admin/db/query', { method: 'POST' }) as never,
      '/admin/db/query',
      'POST',
    )

    expect(proxyAdminDbWriteRequest).not.toHaveBeenCalled()
    expect(response.status).toBe(401)
  })
})
