import { NextRequest } from 'next/server'
import { proxyApiRequest } from './api-proxy'

type TeacherGetPath =
  | '/school-mileage/rules'
  | '/school-mileage/students'
  | `/school-mileage/students/${string}/summary`
  | '/school-mileage/entries'
  | '/school-mileage/analytics/overview'
  | '/school-mileage/analytics/students'
  | '/school-mileage/analytics/classes'

type TeacherWritePath =
  | '/school-mileage/entries/batch'
  | `/school-mileage/entries/${string}`

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

async function proxyTeacherRequest(
  request: NextRequest,
  pathname: TeacherGetPath | TeacherWritePath,
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
