import { NextRequest } from 'next/server'
import { proxyTeacherGetRequest } from '@/lib/teacher-api'

export async function GET(request: NextRequest) {
  return proxyTeacherGetRequest(
    request,
    '/school-mileage/analytics/classes',
  )
}
