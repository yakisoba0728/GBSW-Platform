const MAX_ATTEMPTS = 5
const WINDOW_MS = 10 * 60 * 1000

type LoginAttemptRecord = {
  count: number
  resetAt: number
}

const attemptsByIp = new Map<string, LoginAttemptRecord>()

export function getClientIpFromRequestHeaders(headers: Headers) {
  const forwardedFor = headers.get('x-forwarded-for')

  if (forwardedFor) {
    const clientIp = forwardedFor.split(',')[0]?.trim()

    if (clientIp) {
      return clientIp
    }
  }

  const realIp = headers.get('x-real-ip')?.trim()

  if (realIp) {
    return realIp
  }

  return 'unknown'
}

export function getRemainingLoginCooldownSeconds(ip: string) {
  pruneExpiredAttempts()

  const attempt = attemptsByIp.get(ip)

  if (!attempt) {
    return 0
  }

  const remainingMs = attempt.resetAt - Date.now()

  if (attempt.count < MAX_ATTEMPTS || remainingMs <= 0) {
    attemptsByIp.delete(ip)
    return 0
  }

  return Math.ceil(remainingMs / 1000)
}

export function registerFailedLoginAttempt(ip: string) {
  pruneExpiredAttempts()

  const current = attemptsByIp.get(ip)
  const now = Date.now()

  if (!current || current.resetAt <= now) {
    attemptsByIp.set(ip, {
      count: 1,
      resetAt: now + WINDOW_MS,
    })
    return
  }

  attemptsByIp.set(ip, {
    count: current.count + 1,
    resetAt: current.resetAt,
  })
}

export function clearFailedLoginAttempts(ip: string) {
  attemptsByIp.delete(ip)
}

function pruneExpiredAttempts() {
  const now = Date.now()

  for (const [ip, attempt] of attemptsByIp.entries()) {
    if (attempt.resetAt <= now) {
      attemptsByIp.delete(ip)
    }
  }
}
