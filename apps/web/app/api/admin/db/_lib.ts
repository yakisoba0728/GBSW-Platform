import { NextResponse, type NextRequest } from 'next/server'
import { getServerAuthSession } from '@/lib/route-guards'
import {
  proxyAdminDbGetRequest,
  proxyAdminDbWriteRequest,
} from '@/lib/admin-api'

export const ADMIN_DB_UNAUTHORIZED_MESSAGE = '최고관리자만 DB 콘솔을 사용할 수 있습니다.'

export async function ensureAdminDbSuperAdminAccess() {
  const session = await getServerAuthSession().catch(() => null)

  if (!session || session.role !== 'super-admin') {
    return NextResponse.json(
      { message: ADMIN_DB_UNAUTHORIZED_MESSAGE },
      { status: 401 },
    )
  }

  return null
}

export async function proxyAdminDbGetRequestWithGuard(
  request: NextRequest,
  pathname: `/admin/db/tables` | `/admin/db/tables/${string}`,
) {
  const unauthorizedResponse = await ensureAdminDbSuperAdminAccess()

  if (unauthorizedResponse) {
    return unauthorizedResponse
  }

  return proxyAdminDbGetRequest(request, pathname)
}

export async function proxyAdminDbWriteRequestWithGuard(
  request: NextRequest,
  pathname: `/admin/db/tables/${string}/${string}` | '/admin/db/query',
  method: 'POST' | 'PATCH' | 'DELETE',
) {
  const unauthorizedResponse = await ensureAdminDbSuperAdminAccess()

  if (unauthorizedResponse) {
    return unauthorizedResponse
  }

  return proxyAdminDbWriteRequest(request, pathname, method)
}
