import { NextRequest } from 'next/server'
import { createRoleProxyRequest } from './api-proxy'

type AdminPath =
  | '/admin/teachers'
  | `/admin/teachers/${string}`
  | `/admin/teachers/${string}/status`

type AdminCreatePath = '/admin/teachers'

type AdminGetPath =
  | '/admin/teachers'

type AdminWritePath =
  | `/admin/teachers/${string}`
  | `/admin/teachers/${string}/status`

type AdminMileageGetPath = '/school-mileage/rules' | '/dorm-mileage/rules'

type AdminMileageWritePath =
  | '/school-mileage/rules'
  | `/school-mileage/rules/${string}`
  | `/school-mileage/rules/${string}/toggle`
  | '/dorm-mileage/rules'
  | `/dorm-mileage/rules/${string}`
  | `/dorm-mileage/rules/${string}/toggle`

type AdminDbGetPath =
  | '/admin/db/tables'
  | `/admin/db/tables/${string}`

type AdminDbWritePath =
  | `/admin/db/tables/${string}/${string}`
  | '/admin/db/query'

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

export async function proxyAdminDbGetRequest(
  request: NextRequest,
  pathname: AdminDbGetPath,
) {
  return proxyAdminRoleRequest(request, pathname, 'GET')
}

export async function proxyAdminDbWriteRequest(
  request: NextRequest,
  pathname: AdminDbWritePath,
  method: 'POST' | 'PATCH' | 'DELETE',
) {
  return proxyAdminRoleRequest(request, pathname, method)
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
