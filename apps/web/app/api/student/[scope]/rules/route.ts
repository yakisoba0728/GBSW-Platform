import { NextRequest, NextResponse } from 'next/server'
import type { RouteParamsContext } from '@/lib/api-route-handlers'
import { proxyStudentGetRequest } from '@/lib/student-api'
import { parseScopeParam, scopeToApiPrefix } from '@/lib/scope-utils'

export async function GET(request: NextRequest, context: RouteParamsContext<'scope'>) {
  const { scope: rawScope } = await context.params
  const scope = parseScopeParam(rawScope)
  if (!scope) return NextResponse.json({ message: '존재하지 않는 경로입니다.' }, { status: 404 })
  return proxyStudentGetRequest(request, `/${scopeToApiPrefix(scope)}/my/rules` as any)
}
