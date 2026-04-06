'use client'

import { Badge, Card, SectionTitle, formatAwardedAtParts, formatSignedScore } from './teacher-shared'
import {
  AnimatedTableRow,
  EmptyStatePane,
  TableRowSkeleton,
} from '../ui/list'
import { Pagination } from '../ui/primitives'
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
    <Card className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
      {/* 헤더 */}
      <div className="flex-shrink-0 px-4 py-3" style={{ borderBottom: '1px solid var(--admin-border)' }}>
        <SectionTitle>
          {studentName} 상벌점 내역
          {totalEntryCount > 0 && (
            <span
              className="ml-1.5 text-xs font-normal"
              style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--admin-text-muted)' }}
            >
              ({totalEntryCount}건)
            </span>
          )}
        </SectionTitle>
      </div>

      {/* 테이블 */}
      <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto">
        {isLoading ? (
          <TableRowSkeleton columns={6} count={5} />
        ) : entries.length === 0 ? (
          <EmptyStatePane
            className="h-full"
            title="처리 내역이 없습니다"
            description="이 학생에게 아직 부여된 상벌점이 없습니다."
          />
        ) : (
          <table className="w-full text-xs">
            <thead className="table-header">
              <tr>
                {['유형', '카테고리', '항목', '점수', '사유', '일시'].map((h) => (
                  <th key={h} className="px-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => {
                const { date, time } = formatAwardedAtParts(entry.awardedAt)
                return (
                  <AnimatedTableRow
                    key={entry.id}
                    index={index}
                    style={{ borderBottom: '1px solid var(--admin-border)' }}
                  >
                    <td className="px-3 py-2">
                      <Badge type={entry.type}>
                        {entry.type === 'reward' ? '상점' : '벌점'}
                      </Badge>
                    </td>
                    <td className="px-3 py-2" style={{ color: 'var(--admin-text-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
                      {entry.ruleCategory}
                    </td>
                    <td className="px-3 py-2 font-medium" style={{ color: 'var(--admin-text)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
                      {entry.ruleName}
                    </td>
                    <td className="px-3 py-2 font-semibold" style={{ fontFamily: 'var(--font-space-grotesk)', color: entry.type === 'reward' ? 'var(--mileage-green)' : 'var(--mileage-red)' }}>
                      {formatSignedScore(entry.type, entry.score)}
                    </td>
                    <td className="max-w-[180px] truncate px-3 py-2" style={{ color: 'var(--admin-text-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
                      {entry.reason ?? '—'}
                    </td>
                    <td className="px-3 py-2" style={{ color: 'var(--admin-text-muted)' }}>
                      <span style={{ fontFamily: 'var(--font-space-grotesk)' }}>{date}</span>
                      {time && (
                        <span className="ml-1 text-[10px]" style={{ fontFamily: 'var(--font-space-grotesk)', opacity: 0.65 }}>
                          {time}
                        </span>
                      )}
                    </td>
                  </AnimatedTableRow>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 페이지네이션 */}
      {!isLoading && totalEntryCount > 0 && (
        <div className="flex-shrink-0 px-4 pb-3">
          <Pagination
            page={page}
            pageCount={pageCount}
            totalCount={totalEntryCount}
            onChange={onPageChange}
          />
        </div>
      )}
    </Card>
  )
}
