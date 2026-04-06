import { NextRequest } from 'next/server'
import { proxyTeacherGetRequest, proxyTeacherWriteRequest } from '@/lib/teacher-api'

export async function GET(request: NextRequest) {
  return proxyTeacherGetRequest(request, '/school-mileage/rules')
}

export async function POST(request: NextRequest) {
  return proxyTeacherWriteRequest(request, '/school-mileage/rules', 'POST')
}
