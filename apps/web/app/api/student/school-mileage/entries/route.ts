import { NextRequest } from 'next/server'
import { proxyStudentGetRequest } from '@/lib/student-api'

export async function GET(request: NextRequest) {
  return proxyStudentGetRequest(request, '/school-mileage/my/entries')
}
