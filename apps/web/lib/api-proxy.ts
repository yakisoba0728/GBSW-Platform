import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { getApiBaseUrl } from './api-base-url'
import {
  AUTH_SESSION_COOKIE,
  type AuthRole,
  type AuthSession,
  readAuthSessionId,
  resolveAuthSession,
} from './auth-session'
import { getInternalApiSecret } from './runtime-env'

type ProxyApiRequestOptions = {
  pathname: string
  method: ProxyRequestMethod
  allowedRole: AuthRole
  unauthorizedMessage: string
  proxyFailureMessage: string
  actorHeaders?: (session: AuthSession) => Record<string, string | undefined>
}

export type ProxyRequestMethod = 'GET' | 'POST' | 'PATCH' | 'DELETE'

type ResponseBody =
  | { kind: 'json'; body: unknown }
  | { kind: 'text'; body: string }
  | { kind: 'empty' }

export async function readJsonRequestBody(
  request: NextRequest,
): Promise<{ ok: true; body: unknown } | { ok: false }> {
  try {
    const body = await request.json()
    return { ok: true, body }
  } catch {
    return { ok: false }
  }
}

export async function readResponseBody(response: Response): Promise<ResponseBody> {
  const contentType = response.headers.get('content-type') ?? ''
  if (contentType.includes('application/json')) {
    const body = await response.json().catch(() => null)
    return { kind: 'json', body }
  }
  const text = await response.text().catch(() => '')
  if (text.length === 0) return { kind: 'empty' }
  return { kind: 'text', body: text }
}

export function getResponseMessage(
  responseBody: ResponseBody,
  defaultMessage: string,
): string {
  if (responseBody.kind === 'json') {
    const payload = responseBody.body as Record<string, unknown> | null
    if (typeof payload?.message === 'string' && payload.message.length > 0) {
      return payload.message
    }
  }
  return defaultMessage
}

type RoleProxyRequestOptions = Omit<ProxyApiRequestOptions, 'pathname' | 'method'>

export async function proxyApiRequest(
  request: NextRequest,
  {
    pathname,
    method,
    allowedRole,
    unauthorizedMessage,
    proxyFailureMessage,
    actorHeaders,
  }: ProxyApiRequestOptions,
) {
  let session: AuthSession | null = null

  try {
    const sessionId = readAuthSessionId(
      (await cookies()).get(AUTH_SESSION_COOKIE)?.value,
    )
    session = await resolveAuthSession(sessionId)
  } catch {
    return NextResponse.json(
      { message: proxyFailureMessage },
      { status: 502 },
    )
  }

  if (!session || session.role !== allowedRole) {
    return NextResponse.json(
      { message: unauthorizedMessage },
      { status: 401 },
    )
  }

  const upstreamUrl = new URL(`${getApiBaseUrl()}${pathname}`)

  request.nextUrl.searchParams.forEach((value, key) => {
    upstreamUrl.searchParams.append(key, value)
  })

  const hasJsonBody = method === 'POST' || method === 'PATCH'
  const body = hasJsonBody ? await request.json().catch(() => null) : undefined

  try {
    const response = await fetch(upstreamUrl, {
      method,
      headers: buildProxyHeaders(session, actorHeaders, hasJsonBody),
      body: hasJsonBody ? JSON.stringify(body ?? {}) : undefined,
      cache: 'no-store',
    })

    const payload = await response.json().catch(() => null)

    return NextResponse.json(
      payload ?? { message: '서버 응답을 처리하지 못했습니다.' },
      { status: response.status },
    )
  } catch {
    return NextResponse.json(
      { message: proxyFailureMessage },
      { status: 502 },
    )
  }
}

export function createRoleProxyRequest({
  allowedRole,
  unauthorizedMessage,
  proxyFailureMessage,
  actorHeaders,
}: RoleProxyRequestOptions) {
  return function proxyRoleRequest<Pathname extends string>(
    request: NextRequest,
    pathname: Pathname,
    method: ProxyRequestMethod,
  ) {
    return proxyApiRequest(request, {
      pathname,
      method,
      allowedRole,
      unauthorizedMessage,
      proxyFailureMessage,
      actorHeaders,
    })
  }
}

export async function buildProxyResponse(
  upstreamResponse: Response,
): Promise<Response> {
  const upstreamContentType =
    upstreamResponse.headers.get('content-type') ?? 'application/octet-stream'

  if (upstreamContentType.includes('application/json')) {
    const payload = await upstreamResponse.json().catch(() => null)
    return NextResponse.json(
      payload ?? { message: '서버 응답을 처리하지 못했습니다.' },
      { status: upstreamResponse.status },
    )
  }

  const headers = new Headers()
  headers.set('content-type', upstreamContentType)

  const contentDisposition = upstreamResponse.headers.get('content-disposition')
  if (contentDisposition) {
    headers.set('content-disposition', contentDisposition)
  }

  const contentLength = upstreamResponse.headers.get('content-length')
  if (contentLength) {
    headers.set('content-length', contentLength)
  }

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers,
  })
}

function buildProxyHeaders(
  session: AuthSession,
  actorHeaders: ProxyApiRequestOptions['actorHeaders'],
  hasJsonBody: boolean,
) {
  const headers: Record<string, string> = {
    'x-internal-api-secret': getInternalApiSecret(),
    'x-actor-session-id': session.id,
  }

  if (hasJsonBody) {
    headers['Content-Type'] = 'application/json'
  }

  for (const [key, value] of Object.entries(actorHeaders?.(session) ?? {})) {
    if (typeof value === 'string' && value.length > 0) {
      headers[key] = value
    }
  }

  return headers
}
