import { NextRequest } from 'next/server'
import { proxyTeacherWriteRequest } from '@/lib/teacher-api'

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { id } = await context.params

  return proxyTeacherWriteRequest(
    request,
    `/dorm-mileage/entries/${encodeURIComponent(id)}`,
    'PATCH',
  )
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { id } = await context.params

  return proxyTeacherWriteRequest(
    request,
    `/dorm-mileage/entries/${encodeURIComponent(id)}`,
    'DELETE',
  )
}
