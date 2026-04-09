import { createStaticProxyHandler } from '@/lib/api-route-handlers'
import { proxyAdminCreateRequest, proxyAdminGetRequest } from '@/lib/admin-api'

export const GET = createStaticProxyHandler(proxyAdminGetRequest, '/admin/teachers')
export const POST = createStaticProxyHandler(
  proxyAdminCreateRequest,
  '/admin/teachers',
)
