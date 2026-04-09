import { NextRequest } from 'next/server'
import { createRoleProxyRequest } from './api-proxy'

type AdminPath =
  | '/admin/students'
  | `/admin/students/${string}`
  | `/admin/students/${string}/status`
  | `/admin/students/${string}/deactivate`
  | '/admin/teachers'
  | `/admin/teachers/${string}`
  | `/admin/teachers/${string}/status`
  | `/admin/teachers/${string}/deactivate`
  | '/admin/students/major-subjects'

type AdminCreatePath = '/admin/students' | '/admin/teachers'

type AdminGetPath =
  | '/admin/students'
  | '/admin/students/major-subjects'
  | '/admin/teachers'

type AdminWritePath =
  | `/admin/students/${string}`
  | `/admin/students/${string}/status`
  | `/admin/students/${string}/deactivate`
  | `/admin/teachers/${string}`
  | `/admin/teachers/${string}/status`
  | `/admin/teachers/${string}/deactivate`

type AdminMileageGetPath = '/school-mileage/rules' | '/dorm-mileage/rules'

type AdminMileageWritePath =
  | '/school-mileage/rules'
  | `/school-mileage/rules/${string}`
  | `/school-mileage/rules/${string}/toggle`
  | '/dorm-mileage/rules'
  | `/dorm-mileage/rules/${string}`
  | `/dorm-mileage/rules/${string}/toggle`

export async function proxyAdminCreateRequest(
  request: NextRequest,
  pathname: AdminCreatePath,
) {
  return proxyAdminRequest(request, pathname, 'POST')
}

export async function proxyAdminGetRequest(
  request: NextRequest,
  pathname: AdminGetPath,
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

export async function proxyAdminRequest(
  request: NextRequest,
  pathname: AdminPath,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
) {
  return proxyAdminRoleRequest(request, pathname, method)
}

async function proxyAdminMileageRequest(
  request: NextRequest,
  pathname: AdminMileageGetPath | AdminMileageWritePath,
  method: 'GET' | 'POST' | 'PATCH',
) {
  return proxyAdminMileageRoleRequest(request, pathname, method)
}

const buildSuperAdminHeaders = (session: { accountId: string }) => ({
  'x-actor-super-admin-id': session.accountId,
})

const proxyAdminRoleRequest = createRoleProxyRequest({
  allowedRole: 'super-admin',
  unauthorizedMessage: '최고관리자 로그인이 필요합니다.',
  proxyFailureMessage: '관리자 요청을 처리하지 못했습니다.',
  actorHeaders: buildSuperAdminHeaders,
})

const proxyAdminMileageRoleRequest = createRoleProxyRequest({
  allowedRole: 'super-admin',
  unauthorizedMessage: '최고관리자 로그인이 필요합니다.',
  proxyFailureMessage: '상벌점 항목 요청을 처리하지 못했습니다.',
  actorHeaders: buildSuperAdminHeaders,
})
