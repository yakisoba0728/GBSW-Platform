import { NextRequest } from 'next/server'
import { proxyApiRequest } from './api-proxy'

type AdminPath =
  | '/admin/students'
  | '/admin/teachers'
  | '/admin/students/major-subjects'

export async function proxyAdminCreateRequest(
  request: NextRequest,
  pathname: '/admin/students' | '/admin/teachers',
) {
  return proxyAdminRequest(request, pathname, 'POST')
}

export async function proxyAdminGetRequest(
  request: NextRequest,
  pathname: '/admin/students/major-subjects',
) {
  return proxyAdminRequest(request, pathname, 'GET')
}

async function proxyAdminRequest(
  request: NextRequest,
  pathname: AdminPath,
  method: 'GET' | 'POST',
) {
  return proxyApiRequest(request, {
    pathname,
    method,
    allowedRole: 'super-admin',
    unauthorizedMessage: '최고관리자 로그인이 필요합니다.',
    proxyFailureMessage: '계정 생성 요청을 처리하지 못했습니다.',
  })
}
