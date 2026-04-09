export function getApiBaseUrl() {
  const explicitInternalUrl = process.env.API_INTERNAL_URL?.trim()

  if (explicitInternalUrl) {
    return resolveApiBaseUrl(explicitInternalUrl, 'API_INTERNAL_URL')
  }

  const publicApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim()

  if (publicApiUrl) {
    return resolveApiBaseUrl(publicApiUrl, 'NEXT_PUBLIC_API_URL')
  }

  return resolveApiBaseUrl(
    `http://127.0.0.1:${process.env.API_PORT ?? '3001'}`,
    'local API fallback',
  )
}

export function resolveApiBaseUrl(value: string, source: string) {
  let url: URL

  try {
    url = new URL(value)
  } catch {
    throw new Error(`${source} must be an absolute URL.`)
  }

  const normalizedPathname = url.pathname.replace(/\/+$/, '') || '/'

  if (normalizedPathname !== '/') {
    throw new Error(
      `${source} must point directly to the Nest API origin and cannot include the path "${normalizedPathname}".`,
    )
  }

  return `${url.origin}${url.pathname === '/' ? '' : url.pathname}`
}
