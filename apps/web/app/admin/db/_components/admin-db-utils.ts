export const ADMIN_DB_DESKTOP_MIN_WIDTH = 1024
export const ADMIN_DB_PAGE_SIZE = 50
export const ADMIN_DB_REQUEST_TIMEOUT_MS = 15_000

const READ_ONLY_SQL_PREFIX = /^(SELECT|SHOW|DESCRIBE|PRAGMA)\b/i
const MUTATING_SQL_PATTERN =
  /\b(INSERT|UPDATE|DELETE|ALTER|DROP|TRUNCATE|CREATE|REPLACE|MERGE|GRANT|REVOKE|VACUUM|COMMENT)\b/i
const TECHNICAL_ERROR_PATTERN =
  /(stack trace|prisma|syntaxerror|typeerror|referenceerror|relation .* does not exist|column .* does not exist)/i

export type AdminDbBannerTone = 'neutral' | 'warning' | 'danger' | 'success'

export function isAdminDbDesktopViewport(width: number) {
  return width >= ADMIN_DB_DESKTOP_MIN_WIDTH
}

export function shouldConfirmAdminDbSql(sql: string) {
  const normalized = sql.trim().replace(/;+\s*$/, '')

  if (!normalized) {
    return false
  }

  if (MUTATING_SQL_PATTERN.test(normalized)) {
    return true
  }

  const explainNormalized = normalized.replace(/^EXPLAIN(?:\s+ANALYZE)?\s+/i, '')

  if (MUTATING_SQL_PATTERN.test(explainNormalized)) {
    return true
  }

  if (/^WITH\b/i.test(normalized)) {
    return false
  }

  return !READ_ONLY_SQL_PREFIX.test(explainNormalized)
}

export function getAdminDbTotalPages(total: number, pageSize = ADMIN_DB_PAGE_SIZE) {
  return Math.max(1, Math.ceil(total / pageSize))
}

export function extractAdminDbMessage(value: unknown, fallback: string) {
  const message = readMessage(value)

  if (!message) {
    return fallback
  }

  const normalized = message.replace(/\s+/g, ' ').trim()

  if (!normalized || TECHNICAL_ERROR_PATTERN.test(normalized)) {
    return fallback
  }

  return normalized.length > 180 ? `${normalized.slice(0, 177)}...` : normalized
}

export function getAdminDbQuerySummary(sql: string) {
  const normalized = sql.trim().replace(/\s+/g, ' ')

  if (!normalized) {
    return '빈 SQL'
  }

  if (shouldConfirmAdminDbSql(normalized)) {
    return `${normalized.slice(0, 80)}${normalized.length > 80 ? '...' : ''}`
  }

  return `${normalized.slice(0, 120)}${normalized.length > 120 ? '...' : ''}`
}

function readMessage(value: unknown) {
  if (typeof value === 'string') {
    return value
  }

  if (value && typeof value === 'object') {
    const payload = value as Record<string, unknown>

    if (typeof payload.message === 'string') {
      return payload.message
    }

    if (typeof payload.error === 'string') {
      return payload.error
    }
  }

  return null
}
