import { NextRequest, NextResponse } from 'next/server'
import { proxyAdminMileageGetRequest, proxyAdminMileageWriteRequest } from '@/lib/admin-api'
import { parseScopeParam, scopeToApiPrefix } from '@/lib/scope-utils'

type Params = { scope: string; id: string }

export async function GET(request: NextRequest, context: { params: Promise<Params> }) {
  const { scope: rawScope, id } = await context.params
  const scope = parseScopeParam(rawScope)
  if (!scope) return NextResponse.json({ message: '존재하지 않는 경로입니다.' }, { status: 404 })
  return proxyAdminMileageGetRequest(request, `/${scopeToApiPrefix(scope)}/rules/${encodeURIComponent(id)}` as any)
}

export async function PATCH(request: NextRequest, context: { params: Promise<Params> }) {
  const { scope: rawScope, id } = await context.params
  const scope = parseScopeParam(rawScope)
  if (!scope) return NextResponse.json({ message: '존재하지 않는 경로입니다.' }, { status: 404 })
  return proxyAdminMileageWriteRequest(request, `/${scopeToApiPrefix(scope)}/rules/${encodeURIComponent(id)}` as any, 'PATCH')
}

export async function DELETE(request: NextRequest, context: { params: Promise<Params> }) {
  const { scope: rawScope, id } = await context.params
  const scope = parseScopeParam(rawScope)
  if (!scope) return NextResponse.json({ message: '존재하지 않는 경로입니다.' }, { status: 404 })
  return proxyAdminMileageWriteRequest(request, `/${scopeToApiPrefix(scope)}/rules/${encodeURIComponent(id)}` as any, 'DELETE' as any)
}
