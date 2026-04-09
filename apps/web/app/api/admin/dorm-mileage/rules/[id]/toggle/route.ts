import { createParamMethodProxyHandler } from '@/lib/api-route-handlers'
import { proxyAdminMileageWriteRequest } from '@/lib/admin-api'

export const PATCH = createParamMethodProxyHandler(
  'id',
  (id) => `/dorm-mileage/rules/${id}/toggle`,
  proxyAdminMileageWriteRequest,
  'PATCH',
)
