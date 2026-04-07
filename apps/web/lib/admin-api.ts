import { NextRequest } from 'next/server'
import { proxyApiRequest } from './api-proxy'

type AdminPath =
  | '/admin/students'
  | '/admin/teachers'
  | '/admin/students/major-subjects'

type AdminMileageGetPath = '/school-mileage/rules' | '/dorm-mileage/rules'

type AdminMileageWritePath =
  | '/school-mileage/rules'
  | `/school-mileage/rules/${string}`
  | '/dorm-mileage/rules'
  | `/dorm-mileage/rules/${string}`

export async function proxyAdminCreateRequest(
  request: NextRequest,
  pathname: '/admin/students' | '/admin/teachers',
) {
  return proxyAdminRequest(request, pathname, 'POST')
}

type AdminWritePath = `/admin/teachers/${string}`

export async function proxyAdminGetRequest(
  request: NextRequest,
  pathname: '/admin/students/major-subjects' | '/admin/teachers',
) {
  return proxyAdminRequest(request, pathname, 'GET')
}

export async function proxyAdminWriteRequest(
  request: NextRequest,
  pathname: AdminWritePath,
  method: 'PATCH',
) {
  return proxyAdminRequest(request, pathname, method)
}

export async function proxyAdminMileageGetRequest(
  request: NextRequest,
  pathname: AdminMileageGetPath,
) {
  return proxyAdminMileageRequest(request, pathname, 'GET')
}

export async function proxyAdminMileageWriteRequest(
  request: NextRequest,
  pathname: AdminMileageWritePath,
  method: 'POST' | 'PATCH',
) {
  return proxyAdminMileageRequest(request, pathname, method)
}

async function proxyAdminRequest(
  request: NextRequest,
  pathname: AdminPath | AdminWritePath,
  method: 'GET' | 'POST' | 'PATCH',
) {
  return proxyApiRequest(request, {
    pathname,
    method,
    allowedRole: 'super-admin',
    unauthorizedMessage: '최고관리자 로그인이 필요합니다.',
    proxyFailureMessage: '계정 생성 요청을 처리하지 못했습니다.',
  })
}

async function proxyAdminMileageRequest(
  request: NextRequest,
  pathname: AdminMileageGetPath | AdminMileageWritePath,
  method: 'GET' | 'POST' | 'PATCH',
) {
  return proxyApiRequest(request, {
    pathname,
    method,
    allowedRole: 'super-admin',
    unauthorizedMessage: '최고관리자 로그인이 필요합니다.',
    proxyFailureMessage: '상벌점 항목 요청을 처리하지 못했습니다.',
    actorHeaders: (session) => ({
      'x-actor-super-admin-id': session.accountId,
    }),
  })
}
