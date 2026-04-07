import { NextRequest } from 'next/server'
import { proxyAdminWriteRequest } from '@/lib/admin-api'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  return proxyAdminWriteRequest(
    request,
    `/admin/teachers/${encodeURIComponent(id)}`,
    'PATCH',
  )
}
