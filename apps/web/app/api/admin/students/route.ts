import { NextRequest } from 'next/server'
import { proxyAdminCreateRequest } from '@/lib/admin-api'

export async function POST(request: NextRequest) {
  return proxyAdminCreateRequest(request, '/admin/students')
}
