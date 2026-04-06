import { NextRequest } from 'next/server'
import { proxyApiRequest } from './api-proxy'

type TeacherPath =
  | '/school-mileage/rules'
  | `/school-mileage/rules/${string}`
  | '/school-mileage/students'
  | `/school-mileage/students/${string}/summary`
  | '/school-mileage/entries'
  | '/school-mileage/entries/batch'
  | '/school-mileage/analytics/overview'
  | '/school-mileage/analytics/students'
  | '/school-mileage/analytics/classes'
  | `/school-mileage/entries/${string}`

export async function proxyTeacherGetRequest(
  request: NextRequest,
  pathname: TeacherPath,
) {
  return proxyTeacherRequest(request, pathname, 'GET')
}

export async function proxyTeacherWriteRequest(
  request: NextRequest,
  pathname: TeacherPath,
  method: 'POST' | 'PATCH' | 'DELETE',
) {
  return proxyTeacherRequest(request, pathname, method)
}

async function proxyTeacherRequest(
  request: NextRequest,
  pathname: TeacherPath,
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE',
) {
  return proxyApiRequest(request, {
    pathname,
    method,
    allowedRole: 'teacher',
    unauthorizedMessage: '교사 로그인이 필요합니다.',
    proxyFailureMessage: '학교 상벌점 요청을 처리하지 못했습니다.',
    actorHeaders: (session) => ({
      'x-actor-teacher-id': session.accountId,
    }),
  })
}
