import { createParamMethodProxyHandler } from '@/lib/api-route-handlers'
import { proxyTeacherWriteRequest } from '@/lib/teacher-api'

export const PATCH = createParamMethodProxyHandler(
  'id',
  (id) => `/dorm-mileage/entries/${id}`,
  proxyTeacherWriteRequest,
  'PATCH',
)

export const DELETE = createParamMethodProxyHandler(
  'id',
  (id) => `/dorm-mileage/entries/${id}`,
  proxyTeacherWriteRequest,
  'DELETE',
)
