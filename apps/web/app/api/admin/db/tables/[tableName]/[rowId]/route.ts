import { NextRequest } from 'next/server'
import { proxyAdminDbWriteRequestWithGuard } from '../../../_lib'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ tableName: string; rowId: string }> },
) {
  const { tableName, rowId } = await context.params
  return proxyAdminDbWriteRequestWithGuard(
    request,
    `/admin/db/tables/${encodeURIComponent(tableName)}/${encodeURIComponent(rowId)}` as `/admin/db/tables/${string}/${string}`,
    'PATCH',
  )
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ tableName: string; rowId: string }> },
) {
  const { tableName, rowId } = await context.params
  return proxyAdminDbWriteRequestWithGuard(
    request,
    `/admin/db/tables/${encodeURIComponent(tableName)}/${encodeURIComponent(rowId)}` as `/admin/db/tables/${string}/${string}`,
    'DELETE',
  )
}
