import {
  createMethodProxyHandler,
  createStaticProxyHandler,
} from '@/lib/api-route-handlers'
import {
  proxyTeacherGetRequest,
  proxyTeacherWriteRequest,
} from '@/lib/teacher-api'

export const GET = createStaticProxyHandler(
  proxyTeacherGetRequest,
  '/school-mileage/entries',
)
export const POST = createMethodProxyHandler(
  proxyTeacherWriteRequest,
  '/school-mileage/entries/batch',
  'POST',
)
