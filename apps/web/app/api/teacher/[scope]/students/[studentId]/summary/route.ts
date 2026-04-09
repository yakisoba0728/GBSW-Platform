import { NextRequest, NextResponse } from 'next/server'
import { proxyTeacherGetRequest } from '@/lib/teacher-api'
import { parseScopeParam, scopeToApiPrefix } from '@/lib/scope-utils'

type Params = { scope: string; studentId: string }

export async function GET(request: NextRequest, context: { params: Promise<Params> }) {
  const { scope: rawScope, studentId } = await context.params
  const scope = parseScopeParam(rawScope)
  if (!scope) return NextResponse.json({ message: '존재하지 않는 경로입니다.' }, { status: 404 })
  return proxyTeacherGetRequest(request, `/${scopeToApiPrefix(scope)}/students/${encodeURIComponent(studentId)}/summary` as any)
}
