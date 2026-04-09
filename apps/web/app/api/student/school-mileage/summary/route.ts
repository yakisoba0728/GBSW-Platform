import { createStaticProxyHandler } from '@/lib/api-route-handlers'
import { proxyStudentGetRequest } from '@/lib/student-api'

export const GET = createStaticProxyHandler(
  proxyStudentGetRequest,
  '/school-mileage/my/summary',
)
