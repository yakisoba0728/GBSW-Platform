const REQUIRED_RUNTIME_ENV_NAMES = ['INTERNAL_API_SECRET'] as const;

type RequiredRuntimeEnvName = (typeof REQUIRED_RUNTIME_ENV_NAMES)[number];

type ApiRuntimeEnv = Record<RequiredRuntimeEnvName, string>;

let cachedRuntimeEnv: ApiRuntimeEnv | null = null;

export function validateApiRuntimeEnv() {
  getApiRuntimeEnv();
  getOptionalSuperAdminBootstrapCredentials();
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

export function getOptionalSuperAdminBootstrapCredentials() {
  const id = readOptionalEnv('SUPER_ADMIN_ID');
  const passwordHash = readOptionalEnv('SUPER_ADMIN_PASSWORD_HASH');

  if (!id && !passwordHash) {
    return null;
  }

  if (!id || !passwordHash) {
    throw new Error(
      'SUPER_ADMIN_ID와 SUPER_ADMIN_PASSWORD_HASH는 함께 설정해야 합니다.',
    );
  }

  validateSuperAdminPasswordHash(passwordHash);

  return {
    id,
    passwordHash,
  };
}

function readRequiredEnv(name: RequiredRuntimeEnvName) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`${name} 환경변수가 필요합니다.`);
  }

  return value;
}

function readOptionalEnv(name: string) {
  const value = process.env[name]?.trim();

  return value && value.length > 0 ? value : null;
}

function validateSuperAdminPasswordHash(passwordHash: string) {
  const [salt, hash] = passwordHash.split(':');

  if (!salt || !hash) {
    throw new Error(
      'SUPER_ADMIN_PASSWORD_HASH는 "<salt>:<hash>" 형식이어야 합니다.',
    );
  }

  if (!/^[0-9a-f]+$/i.test(salt) || !/^[0-9a-f]+$/i.test(hash)) {
    throw new Error('SUPER_ADMIN_PASSWORD_HASH는 hex 문자열이어야 합니다.');
  }

  if (salt.length < 32 || hash.length < 128) {
    throw new Error(
      'SUPER_ADMIN_PASSWORD_HASH는 hashPassword로 생성한 값을 사용해야 합니다.',
    );
  }
}
