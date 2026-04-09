import { createStaticProxyHandler } from '@/lib/api-route-handlers'
import { proxyTeacherGetRequest } from '@/lib/teacher-api'

export const GET = createStaticProxyHandler(
  proxyTeacherGetRequest,
  '/school-mileage/rules',
)
