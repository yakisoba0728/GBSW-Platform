import { NextRequest } from 'next/server'
import { proxyAdminMileageWriteRequest } from '@/lib/admin-api'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  return proxyAdminMileageWriteRequest(
    request,
    `/dorm-mileage/rules/${encodeURIComponent(id)}`,
    'PATCH',
  )
}
