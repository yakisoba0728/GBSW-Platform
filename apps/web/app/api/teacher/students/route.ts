import { createStaticProxyHandler, createMethodProxyHandler } from '@/lib/api-route-handlers'
import { proxyTeacherStudentGetRequest, proxyTeacherStudentWriteRequest } from '@/lib/teacher-api'

export const GET = createStaticProxyHandler(proxyTeacherStudentGetRequest, '/teacher/students')
export const POST = createMethodProxyHandler(proxyTeacherStudentWriteRequest, '/teacher/students', 'POST')
