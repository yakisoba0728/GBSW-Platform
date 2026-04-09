import {
  createMethodProxyHandler,
  createStaticProxyHandler,
} from '@/lib/api-route-handlers'
import { proxyAdminMileageGetRequest, proxyAdminMileageWriteRequest } from '@/lib/admin-api'

export const GET = createStaticProxyHandler(
  proxyAdminMileageGetRequest,
  '/dorm-mileage/rules',
)
export const POST = createMethodProxyHandler(
  proxyAdminMileageWriteRequest,
  '/dorm-mileage/rules',
  'POST',
)
