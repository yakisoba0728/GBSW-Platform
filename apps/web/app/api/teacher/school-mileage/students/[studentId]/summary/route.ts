import { NextRequest } from 'next/server'
import { proxyTeacherGetRequest } from '@/lib/teacher-api'

type Context = {
  params: Promise<{
    studentId: string
  }>
}

export async function GET(request: NextRequest, context: Context) {
  const { studentId } = await context.params

  return proxyTeacherGetRequest(
    request,
    `/school-mileage/students/${encodeURIComponent(studentId)}/summary`,
  )
}
