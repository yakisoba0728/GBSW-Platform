import { NextRequest, NextResponse } from 'next/server'
import type { RouteParamsContext } from '@/lib/api-route-handlers'
import { proxyTeacherGetRequest } from '@/lib/teacher-api'
import { parseScopeParam, scopeToApiPrefix } from '@/lib/scope-utils'

export async function GET(request: NextRequest, context: RouteParamsContext<'scope'>) {
  const { scope: rawScope } = await context.params
  const scope = parseScopeParam(rawScope)
  if (!scope) return NextResponse.json({ message: '존재하지 않는 경로입니다.' }, { status: 404 })
  return proxyTeacherGetRequest(request, `/${scopeToApiPrefix(scope)}/analytics/classes` as any)
}
