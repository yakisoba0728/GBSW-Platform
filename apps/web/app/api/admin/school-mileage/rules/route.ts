import { NextRequest } from 'next/server'
import { proxyAdminMileageGetRequest, proxyAdminMileageWriteRequest } from '@/lib/admin-api'

export async function GET(request: NextRequest) {
  return proxyAdminMileageGetRequest(request, '/school-mileage/rules')
}

export async function POST(request: NextRequest) {
  return proxyAdminMileageWriteRequest(request, '/school-mileage/rules', 'POST')
}
