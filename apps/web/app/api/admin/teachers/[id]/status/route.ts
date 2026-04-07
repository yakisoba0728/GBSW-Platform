import { NextRequest } from 'next/server'
import { proxyAdminRequest } from '@/lib/admin-api'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  return proxyAdminRequest(
    request,
    `/admin/teachers/${encodeURIComponent(id)}/status`,
    'PATCH',
  )
}
