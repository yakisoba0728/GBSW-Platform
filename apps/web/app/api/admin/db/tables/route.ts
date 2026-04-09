import { createStaticProxyHandler } from '@/lib/api-route-handlers'
import { proxyAdminDbGetRequestWithGuard } from '../_lib'

export const GET = createStaticProxyHandler(
  proxyAdminDbGetRequestWithGuard,
  '/admin/db/tables',
)
