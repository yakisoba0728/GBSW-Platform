import { createParamMethodProxyHandler } from '@/lib/api-route-handlers'
import { proxyAdminRequest } from '@/lib/admin-api'

export const PATCH = createParamMethodProxyHandler(
  'id',
  (id) => `/admin/students/${id}/deactivate`,
  proxyAdminRequest,
  'PATCH',
)
