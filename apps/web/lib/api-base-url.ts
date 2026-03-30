export function getApiBaseUrl() {
  const value =
    process.env.API_INTERNAL_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    `http://127.0.0.1:${process.env.API_PORT ?? '3001'}`

  return value.endsWith('/') ? value.slice(0, -1) : value
}
