import { NextRequest } from 'next/server'
import {
  proxyTeacherGetRequest,
  proxyTeacherWriteRequest,
} from '@/lib/teacher-api'

export async function GET(request: NextRequest) {
  return proxyTeacherGetRequest(request, '/dorm-mileage/entries')
}

export async function POST(request: NextRequest) {
  return proxyTeacherWriteRequest(
    request,
    '/dorm-mileage/entries/batch',
    'POST',
  )
}
