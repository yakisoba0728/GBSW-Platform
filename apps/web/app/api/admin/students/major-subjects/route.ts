import { createStaticProxyHandler } from '@/lib/api-route-handlers'
import { proxyAdminGetRequest } from '@/lib/admin-api'

export const GET = createStaticProxyHandler(
  proxyAdminGetRequest,
  '/admin/students/major-subjects',
)
