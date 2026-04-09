import { createParamProxyHandler } from '@/lib/api-route-handlers'
import { proxyAdminDbGetRequestWithGuard } from '../../_lib'

export const GET = createParamProxyHandler(
  'tableName',
  (name) => `/admin/db/tables/${name}` as const,
  proxyAdminDbGetRequestWithGuard,
)
