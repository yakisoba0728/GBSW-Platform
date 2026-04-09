import { NextRequest } from 'next/server'
import { createRoleProxyRequest } from './api-proxy'

type StudentPath =
  | '/school-mileage/my/summary'
  | '/school-mileage/my/stats'
  | '/school-mileage/my/entries'
  | '/school-mileage/my/entries/export'
  | '/school-mileage/my/rules'
  | '/dorm-mileage/my/summary'
  | '/dorm-mileage/my/stats'
  | '/dorm-mileage/my/entries'
  | '/dorm-mileage/my/entries/export'
  | '/dorm-mileage/my/rules'

export async function proxyStudentGetRequest(
  request: NextRequest,
  pathname: StudentPath,
) {
  return proxyStudentRoleRequest(request, pathname, 'GET')
}

const proxyStudentRoleRequest = createRoleProxyRequest({
  allowedRole: 'student',
  unauthorizedMessage: '학생 로그인이 필요합니다.',
  proxyFailureMessage: '학생 상벌점 요청을 처리하지 못했습니다.',
  actorHeaders: (session) => ({
    'x-actor-student-id': session.accountId,
  }),
})
