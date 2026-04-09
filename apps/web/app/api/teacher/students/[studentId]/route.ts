import { createParamProxyHandler, createParamMethodProxyHandler } from '@/lib/api-route-handlers'
import { proxyTeacherStudentGetRequest, proxyTeacherStudentWriteRequest } from '@/lib/teacher-api'

export const GET = createParamProxyHandler(
  'studentId',
  (id) => `/teacher/students/${id}` as const,
  proxyTeacherStudentGetRequest,
)

export const PATCH = createParamMethodProxyHandler(
  'studentId',
  (id) => `/teacher/students/${id}` as const,
  proxyTeacherStudentWriteRequest,
  'PATCH',
)

export const DELETE = createParamMethodProxyHandler(
  'studentId',
  (id) => `/teacher/students/${id}` as const,
  proxyTeacherStudentWriteRequest,
  'DELETE',
)
