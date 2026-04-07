import { NextRequest } from 'next/server'
import { proxyAdminCreateRequest, proxyAdminGetRequest } from '@/lib/admin-api'

export async function GET(request: NextRequest) {
  return proxyAdminGetRequest(request, '/admin/teachers')
}

export async function POST(request: NextRequest) {
  return proxyAdminCreateRequest(request, '/admin/teachers')
}
