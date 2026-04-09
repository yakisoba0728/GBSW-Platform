import { createParamMethodProxyHandler } from '@/lib/api-route-handlers'
import { proxyTeacherStudentWriteRequest } from '@/lib/teacher-api'

export const POST = createParamMethodProxyHandler(
  'studentId',
  (id) => `/teacher/students/${id}/reset-password` as const,
  proxyTeacherStudentWriteRequest,
  'POST',
)
