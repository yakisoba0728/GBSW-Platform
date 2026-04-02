import { NextRequest } from 'next/server'
import {
  proxyTeacherGetRequest,
  proxyTeacherWriteRequest,
} from '@/lib/teacher-api'

export async function GET(request: NextRequest) {
  return proxyTeacherGetRequest(request, '/school-mileage/entries')
}

export async function POST(request: NextRequest) {
  return proxyTeacherWriteRequest(
    request,
    '/school-mileage/entries/batch',
    'POST',
  )
}
