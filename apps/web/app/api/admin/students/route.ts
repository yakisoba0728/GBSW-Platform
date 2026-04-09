import { createStaticProxyHandler } from '@/lib/api-route-handlers'
import {
  proxyAdminCreateRequest,
  proxyAdminGetRequest,
} from '@/lib/admin-api'

export const GET = createStaticProxyHandler(proxyAdminGetRequest, '/admin/students')
export const POST = createStaticProxyHandler(
  proxyAdminCreateRequest,
  '/admin/students',
)
