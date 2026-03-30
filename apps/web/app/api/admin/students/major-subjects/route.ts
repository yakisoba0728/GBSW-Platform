import { NextRequest } from 'next/server'
import { proxyAdminGetRequest } from '@/lib/admin-api'

export async function GET(request: NextRequest) {
  return proxyAdminGetRequest(request, '/admin/students/major-subjects')
}
