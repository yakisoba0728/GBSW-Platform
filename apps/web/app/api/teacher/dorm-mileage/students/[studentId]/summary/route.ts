import { createParamProxyHandler } from '@/lib/api-route-handlers'
import { proxyTeacherGetRequest } from '@/lib/teacher-api'

export const GET = createParamProxyHandler(
  'studentId',
  (studentId) => `/dorm-mileage/students/${studentId}/summary`,
  proxyTeacherGetRequest,
)
