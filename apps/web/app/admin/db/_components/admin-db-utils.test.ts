import { describe, expect, it } from 'vitest'
import {
  ADMIN_DB_DESKTOP_MIN_WIDTH,
  extractAdminDbMessage,
  getAdminDbQuerySummary,
  getAdminDbTotalPages,
  isAdminDbDesktopViewport,
  shouldConfirmAdminDbSql,
} from './admin-db-utils'

describe('admin-db-utils', () => {
  it('detects safe and destructive SQL', () => {
    expect(shouldConfirmAdminDbSql('SELECT * FROM students LIMIT 10;')).toBe(false)
    expect(shouldConfirmAdminDbSql('WITH sample AS (SELECT 1) SELECT * FROM sample')).toBe(false)
    expect(shouldConfirmAdminDbSql('WITH doomed AS (DELETE FROM students RETURNING *) SELECT * FROM doomed')).toBe(true)
    expect(shouldConfirmAdminDbSql('EXPLAIN ANALYZE DELETE FROM students WHERE student_id = 1')).toBe(true)
    expect(shouldConfirmAdminDbSql('DELETE FROM students WHERE id = 1')).toBe(true)
    expect(shouldConfirmAdminDbSql('ALTER TABLE students ADD COLUMN nickname text')).toBe(true)
  })

  it('normalizes noisy backend errors into safe messages', () => {
    expect(extractAdminDbMessage({ message: '  권한이 없습니다.  ' }, 'fallback')).toBe('권한이 없습니다.')
    expect(
      extractAdminDbMessage(
        { message: 'PrismaClientKnownRequestError: relation students does not exist' },
        'fallback',
      ),
    ).toBe('fallback')
  })

  it('formats query summaries and paging helpers', () => {
    expect(getAdminDbQuerySummary('SELECT * FROM students LIMIT 10;')).toBe('SELECT * FROM students LIMIT 10;')
    expect(getAdminDbTotalPages(0)).toBe(1)
    expect(getAdminDbTotalPages(101)).toBe(3)
  })

  it('exposes the desktop viewport threshold', () => {
    expect(ADMIN_DB_DESKTOP_MIN_WIDTH).toBe(1024)
    expect(isAdminDbDesktopViewport(1024)).toBe(true)
    expect(isAdminDbDesktopViewport(1023)).toBe(false)
  })
})
