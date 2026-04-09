import { createParamMethodProxyHandler } from '@/lib/api-route-handlers'
import { proxyAdminMileageWriteRequest } from '@/lib/admin-api'

export const PATCH = createParamMethodProxyHandler(
  'id',
  (id) => `/school-mileage/rules/${id}`,
  proxyAdminMileageWriteRequest,
  'PATCH',
)
