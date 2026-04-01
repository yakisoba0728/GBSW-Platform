const REQUIRED_RUNTIME_ENV_NAMES = [
  'AUTH_SESSION_SECRET',
  'SUPER_ADMIN_ID',
  'SUPER_ADMIN_PASSWORD',
  'INTERNAL_API_SECRET',
] as const

type RequiredRuntimeEnvName = (typeof REQUIRED_RUNTIME_ENV_NAMES)[number]

type WebRuntimeEnv = Record<RequiredRuntimeEnvName, string>

let cachedRuntimeEnv: WebRuntimeEnv | null = null

export function validateWebRuntimeEnv() {
  return getWebRuntimeEnv()
}

export function getWebRuntimeEnv() {
  if (cachedRuntimeEnv) {
    return cachedRuntimeEnv
  }

  const runtimeEnv = Object.freeze(
    Object.fromEntries(
      REQUIRED_RUNTIME_ENV_NAMES.map((name) => [name, readRequiredEnv(name)]),
    ) as WebRuntimeEnv,
  )

  cachedRuntimeEnv = runtimeEnv

  return runtimeEnv
}

export function getAuthSessionSecret() {
  return getWebRuntimeEnv().AUTH_SESSION_SECRET
}

export function getInternalApiSecret() {
  return getWebRuntimeEnv().INTERNAL_API_SECRET
}

export function getSuperAdminCredentials() {
  const { SUPER_ADMIN_ID, SUPER_ADMIN_PASSWORD } = getWebRuntimeEnv()

  return {
    id: SUPER_ADMIN_ID,
    password: SUPER_ADMIN_PASSWORD,
  }
}

function readRequiredEnv(name: RequiredRuntimeEnvName) {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(`${name} 환경변수가 필요합니다.`)
  }

  return value
}
