import { NextRequest } from 'next/server'
import { createRoleProxyRequest } from './api-proxy'

type TeacherGetPath =
  | '/school-mileage/rules'
  | '/school-mileage/students'
  | `/school-mileage/students/${string}/summary`
  | '/school-mileage/entries'
  | '/school-mileage/entries/export'
  | '/school-mileage/analytics/overview'
  | '/school-mileage/analytics/export'
  | '/school-mileage/analytics/students'
  | '/school-mileage/analytics/classes'
  | '/dorm-mileage/rules'
  | '/dorm-mileage/students'
  | `/dorm-mileage/students/${string}/summary`
  | '/dorm-mileage/entries'
  | '/dorm-mileage/entries/export'
  | '/dorm-mileage/analytics/overview'
  | '/dorm-mileage/analytics/export'
  | '/dorm-mileage/analytics/students'
  | '/dorm-mileage/analytics/classes'
  | '/dorm-mileage/my/access'
  | '/teacher/students'
  | `/teacher/students/${string}`

type TeacherWritePath =
  | '/school-mileage/entries/batch'
  | `/school-mileage/entries/${string}`
  | '/dorm-mileage/entries/batch'
  | `/dorm-mileage/entries/${string}`
  | '/teacher/students'
  | '/teacher/students/bulk'
  | `/teacher/students/${string}`
  | `/teacher/students/${string}/reset-password`

export async function proxyTeacherGetRequest(
  request: NextRequest,
  pathname: TeacherGetPath,
) {
  return proxyTeacherRequest(request, pathname, 'GET')
}

export async function proxyTeacherWriteRequest(
  request: NextRequest,
  pathname: TeacherWritePath,
  method: 'POST' | 'PATCH' | 'DELETE',
) {
  return proxyTeacherRequest(request, pathname, method)
}

export async function proxyTeacherStudentGetRequest(
  request: NextRequest,
  pathname: TeacherGetPath,
) {
  return proxyTeacherRequest(request, pathname, 'GET')
}

export async function proxyTeacherStudentWriteRequest(
  request: NextRequest,
  pathname: TeacherWritePath,
  method: 'POST' | 'PATCH' | 'DELETE',
) {
  return proxyTeacherRequest(request, pathname, method)
}

async function proxyTeacherRequest(
  request: NextRequest,
  pathname: TeacherGetPath | TeacherWritePath,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
) {
  return proxyTeacherRoleRequest(request, pathname, method)
}

const proxyTeacherRoleRequest = createRoleProxyRequest({
  allowedRole: 'teacher',
  unauthorizedMessage: '교사 로그인이 필요합니다.',
  proxyFailureMessage: '상벌점 요청을 처리하지 못했습니다.',
  actorHeaders: (session) => ({
    'x-actor-teacher-id': session.accountId,
  }),
})
