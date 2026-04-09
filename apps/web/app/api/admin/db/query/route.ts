import { createMethodProxyHandler } from '@/lib/api-route-handlers'
import { proxyAdminDbWriteRequestWithGuard } from '../_lib'

export const POST = createMethodProxyHandler(
  proxyAdminDbWriteRequestWithGuard,
  '/admin/db/query',
  'POST',
)
