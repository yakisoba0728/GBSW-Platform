import { createParamMethodProxyHandler } from '@/lib/api-route-handlers'
import { proxyAdminRequest } from '@/lib/admin-api'

export const PATCH = createParamMethodProxyHandler(
  'id',
  (id) => `/admin/teachers/${id}/deactivate`,
  proxyAdminRequest,
  'PATCH',
)
