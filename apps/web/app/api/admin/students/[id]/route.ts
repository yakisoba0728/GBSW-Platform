import { createParamMethodProxyHandler } from '@/lib/api-route-handlers'
import { proxyAdminRequest } from '@/lib/admin-api'

export const GET = createParamMethodProxyHandler(
  'id',
  (id) => `/admin/students/${id}`,
  proxyAdminRequest,
  'GET',
)

export const PATCH = createParamMethodProxyHandler(
  'id',
  (id) => `/admin/students/${id}`,
  proxyAdminRequest,
  'PATCH',
)
