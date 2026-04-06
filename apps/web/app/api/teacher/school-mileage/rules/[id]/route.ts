import { NextRequest } from 'next/server'
import { proxyTeacherWriteRequest } from '@/lib/teacher-api'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  return proxyTeacherWriteRequest(
    request,
    `/school-mileage/rules/${id}`,
    'PATCH',
  )
}
