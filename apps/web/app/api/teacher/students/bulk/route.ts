import { createMethodProxyHandler } from '@/lib/api-route-handlers'
import { proxyTeacherStudentWriteRequest } from '@/lib/teacher-api'

export const POST = createMethodProxyHandler(proxyTeacherStudentWriteRequest, '/teacher/students/bulk', 'POST')
