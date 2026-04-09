const REQUIRED_RUNTIME_ENV_NAMES = [
  'SUPER_ADMIN_ID',
  'SUPER_ADMIN_PASSWORD',
  'INTERNAL_API_SECRET',
] as const;

type RequiredRuntimeEnvName = (typeof REQUIRED_RUNTIME_ENV_NAMES)[number];

type ApiRuntimeEnv = Record<RequiredRuntimeEnvName, string>;

let cachedRuntimeEnv: ApiRuntimeEnv | null = null;

export function validateApiRuntimeEnv() {
  return getApiRuntimeEnv();
}

export function getApiRuntimeEnv() {
  if (cachedRuntimeEnv) {
    return cachedRuntimeEnv;
  }

  const runtimeEnv = Object.freeze(
    Object.fromEntries(
      REQUIRED_RUNTIME_ENV_NAMES.map((name) => [name, readRequiredEnv(name)]),
    ) as ApiRuntimeEnv,
  );

  cachedRuntimeEnv = runtimeEnv;
  return runtimeEnv;
}

export function getInternalApiSecret() {
  return getApiRuntimeEnv().INTERNAL_API_SECRET;
}

export function resetApiRuntimeEnvCache() {
  cachedRuntimeEnv = null;
}

export function getSuperAdminCredentials() {
  const { SUPER_ADMIN_ID, SUPER_ADMIN_PASSWORD } = getApiRuntimeEnv();

  return {
    id: SUPER_ADMIN_ID,
    password: SUPER_ADMIN_PASSWORD,
  };
}

function readRequiredEnv(name: RequiredRuntimeEnvName) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} 환경변수가 필요합니다.`);
  }

  return value;
}
