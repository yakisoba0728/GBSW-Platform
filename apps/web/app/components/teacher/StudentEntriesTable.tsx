'use client'

import {
  Badge,
  Card,
  SectionTitle,
  formatAwardedAtParts,
  formatSignedScore,
} from './teacher-shared'
import {
  AnimatedTableRow,
  ListEmptyState,
  TableRowSkeleton,
} from '../ui/list'
import type { SchoolMileageHistoryItem } from './school-mileage-types'

type Props = {
  studentName: string
  entries: SchoolMileageHistoryItem[]
  isLoading: boolean
  totalEntryCount: number
  page: number
  pageCount: number
  onPageChange: (page: number) => void
}

export default function StudentEntriesTable({
  studentName,
  entries,
  isLoading,
  totalEntryCount,
  page,
  pageCount,
  onPageChange,
}: Props) {
  return (
    <Card className="overflow-hidden p-0 flex flex-col flex-1 min-h-0">
      <div
        className="flex-shrink-0 px-4 py-3"
        style={{ borderBottom: '1px solid var(--admin-border)' }}
      >
        <SectionTitle>
          {studentName} 상벌점 내역
          {totalEntryCount > 0 && (
            <span
              className="ml-1.5 text-xs font-normal"
              style={{
                fontFamily: 'var(--font-space-grotesk)',
                color: 'var(--admin-text-muted)',
              }}
            >
              ({totalEntryCount}건)
            </span>
          )}
        </SectionTitle>
      </div>
      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto">
        <table className="w-full text-xs">
          <thead>
            <tr
              style={{
                borderBottom: '1px solid var(--admin-border)',
                backgroundColor: 'var(--admin-bg)',
              }}
            >
              {['유형', '카테고리', '항목', '점수', '사유', '일시'].map(
                (header) => (
                  <th
                    key={header}
                    className="px-3 py-3 text-left font-semibold"
                    style={{
                      fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                      color: 'var(--admin-text-muted)',
                    }}
                  >
                    {header}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableRowSkeleton columns={6} count={5} />
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <ListEmptyState
                    title="처리 내역이 없습니다"
                    description="이 학생에게 아직 부여된 상벌점이 없습니다."
                  />
                </td>
              </tr>
            ) : (
              entries.map((entry, index) => {
                const { date, time } = formatAwardedAtParts(entry.awardedAt)

                return (
                  <AnimatedTableRow
                    key={entry.id}
                    index={index}
                    style={{ borderBottom: '1px solid var(--admin-border)' }}
                  >
                    <td className="px-3 py-2.5">
                      <Badge type={entry.type}>
                        {entry.type === 'reward' ? '상점' : '벌점'}
                      </Badge>
                    </td>
                    <td
                      className="px-3 py-2.5"
                      style={{
                        color: 'var(--admin-text-muted)',
                        fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                      }}
                    >
                      {entry.ruleCategory}
                    </td>
                    <td
                      className="px-3 py-2.5 font-medium"
                      style={{
                        color: 'var(--admin-text)',
                        fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                      }}
                    >
                      {entry.ruleName}
                    </td>
                    <td
                      className="px-3 py-2.5 font-semibold"
                      style={{
                        fontFamily: 'var(--font-space-grotesk)',
                        color: entry.type === 'reward' ? '#16a34a' : '#dc2626',
                      }}
                    >
                      {formatSignedScore(entry.type, entry.score)}
                    </td>
                    <td
                      className="max-w-[180px] truncate px-3 py-2.5"
                      style={{
                        color: 'var(--admin-text-muted)',
                        fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                      }}
                    >
                      {entry.reason ?? '—'}
                    </td>
                    <td
                      className="px-3 py-2.5"
                      style={{ color: 'var(--admin-text-muted)' }}
                    >
                      <span style={{ fontFamily: 'var(--font-space-grotesk)' }}>
                        {date}
                      </span>
                      {time && (
                        <span
                          className="ml-1 text-[10px]"
                          style={{
                            fontFamily: 'var(--font-space-grotesk)',
                            color: 'var(--admin-text-muted)',
                          }}
                        >
                          {time}
                        </span>
                      )}
                    </td>
                  </AnimatedTableRow>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {!isLoading && totalEntryCount > 0 && (
        <div className="flex flex-shrink-0 items-center justify-between gap-3 px-4 py-3">
          <p
            className="text-xs"
            style={{
              fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              color: 'var(--admin-text-muted)',
            }}
          >
            총{' '}
            <span style={{ color: 'var(--admin-text)', fontWeight: 600 }}>
              {totalEntryCount.toLocaleString()}
            </span>
            건
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                borderColor: 'var(--admin-border)',
                color: 'var(--admin-text-muted)',
              }}
              aria-label="이전 페이지"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(pageCount, 5) }, (_, index) => {
                let pageNumber: number

                if (pageCount <= 5) {
                  pageNumber = index + 1
                } else if (page <= 3) {
                  pageNumber = index + 1
                } else if (page >= pageCount - 2) {
                  pageNumber = pageCount - 4 + index
                } else {
                  pageNumber = page - 2 + index
                }

                return (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => onPageChange(pageNumber)}
                    className="h-8 min-w-[32px] rounded-lg border px-1.5 text-sm font-medium transition-colors"
                    style={
                      pageNumber === page
                        ? {
                            backgroundColor: 'var(--admin-accent)',
                            color: '#fff',
                            borderColor: 'var(--admin-accent)',
                            fontFamily: 'var(--font-space-grotesk)',
                          }
                        : {
                            color: 'var(--admin-text-muted)',
                            borderColor: 'var(--admin-border)',
                            fontFamily: 'var(--font-space-grotesk)',
                          }
                    }
                  >
                    {pageNumber}
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              onClick={() => onPageChange(Math.min(pageCount, page + 1))}
              disabled={page >= pageCount}
              className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                borderColor: 'var(--admin-border)',
                color: 'var(--admin-text-muted)',
              }}
              aria-label="다음 페이지"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </Card>
  )
}
