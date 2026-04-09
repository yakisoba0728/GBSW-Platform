'use client'

import { useMemo } from 'react'
import { Card, SectionTitle } from '../ui/card'
import { DataTable, type DataTableColumn } from '../ui/data-table'
import { Badge, formatAwardedAtParts, formatSignedScore } from '../mileage/shared'
import { Pagination } from '../ui/primitives'
import type { SharedMileageHistoryItem } from './shared-mileage-types'

type Props = {
  studentName: string
  entries: SharedMileageHistoryItem[]
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
  const columns = useMemo<DataTableColumn<SharedMileageHistoryItem>[]>(
    () => [
      {
        key: 'type',
        header: '유형',
        render: (entry) => (
          <Badge type={entry.type}>
            {entry.type === 'reward' ? '상점' : '벌점'}
          </Badge>
        ),
      },
      {
        key: 'ruleCategory',
        header: '카테고리',
        render: (entry) => (
          <span style={{ color: 'var(--admin-text-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
            {entry.ruleCategory}
          </span>
        ),
      },
      {
        key: 'ruleName',
        header: '항목',
        render: (entry) => (
          <span className="font-medium" style={{ color: 'var(--admin-text)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
            {entry.ruleName}
          </span>
        ),
      },
      {
        key: 'score',
        header: '점수',
        render: (entry) => (
          <span
            className="font-semibold"
            style={{
              fontFamily: 'var(--font-space-grotesk)',
              color: entry.type === 'reward' ? 'var(--mileage-green)' : 'var(--mileage-red)',
            }}
          >
            {formatSignedScore(entry.type, entry.score)}
          </span>
        ),
      },
      {
        key: 'reason',
        header: '사유',
        render: (entry) => (
          <span
            className="block max-w-[180px] truncate"
            style={{ color: 'var(--admin-text-muted)' }}
          >
            {entry.reason ?? '—'}
          </span>
        ),
      },
      {
        key: 'awardedAt',
        header: '일시',
        render: (entry) => {
          const { date, time } = formatAwardedAtParts(entry.awardedAt)
          return (
            <>
              <span style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--admin-text-muted)' }}>
                {date}
              </span>
              {time && (
                <span
                  style={{
                    marginLeft: 4,
                    fontSize: '10px',
                    fontFamily: 'var(--font-space-grotesk)',
                    color: 'var(--admin-text-muted)',
                    opacity: 0.65,
                  }}
                >
                  {time}
                </span>
              )}
            </>
          )
        },
      },
    ],
    [],
  )

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
      <div className="min-h-0 flex-1 overflow-x-auto">
        <DataTable
          columns={columns}
          data={entries}
          rowKey={(entry) => entry.id}
          loading={isLoading}
          emptyTitle="처리 내역이 없습니다"
          emptyDescription="이 학생에게 아직 부여된 상벌점이 없습니다."
        />
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
