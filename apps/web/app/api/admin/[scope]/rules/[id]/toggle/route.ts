import { NextRequest, NextResponse } from 'next/server'
import { proxyAdminMileageWriteRequest } from '@/lib/admin-api'
import { parseScopeParam, scopeToApiPrefix } from '@/lib/scope-utils'

type Params = { scope: string; id: string }

export async function POST(request: NextRequest, context: { params: Promise<Params> }) {
  const { scope: rawScope, id } = await context.params
  const scope = parseScopeParam(rawScope)
  if (!scope) return NextResponse.json({ message: '존재하지 않는 경로입니다.' }, { status: 404 })
  return proxyAdminMileageWriteRequest(request, `/${scopeToApiPrefix(scope)}/rules/${encodeURIComponent(id)}/toggle` as any, 'POST')
}
