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
  '/dorm-mileage/entries',
)
export const POST = createMethodProxyHandler(
  proxyTeacherWriteRequest,
  '/dorm-mileage/entries/batch',
  'POST',
)
