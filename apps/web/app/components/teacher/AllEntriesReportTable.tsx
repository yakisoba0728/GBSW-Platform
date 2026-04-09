'use client'

import { useMemo } from 'react'
import { DataTable, type DataTableColumn } from '../ui/data-table'
import { formatAwardedAtParts } from '../mileage/shared'
import type { SharedReportHistoryItem } from './shared-mileage-types'

export default function AllEntriesReportTable({
  entries,
}: {
  entries: SharedReportHistoryItem[]
}) {
  const columns = useMemo<DataTableColumn<SharedReportHistoryItem>[]>(
    () => [
      {
        key: 'classNumber',
        header: '반',
        render: (row) => (
          <span style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            {row.classNumber}
          </span>
        ),
      },
      {
        key: 'studentNumber',
        header: '번호',
        render: (row) => (
          <span style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            {row.studentNumber}
          </span>
        ),
      },
      {
        key: 'studentName',
        header: '이름',
        render: (row) => (
          <span
            style={{
              fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              fontWeight: 500,
            }}
          >
            {row.studentName}
          </span>
        ),
      },
      {
        key: 'type',
        header: '유형',
        render: (row) => (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              borderRadius: '9999px',
              padding: '2px 8px',
              fontSize: '10px',
              fontWeight: 500,
              backgroundColor:
                row.type === 'reward'
                  ? 'var(--reward-bg-muted)'
                  : 'var(--penalty-bg-muted)',
              color:
                row.type === 'reward' ? 'var(--reward)' : 'var(--penalty)',
            }}
          >
            {row.type === 'reward' ? '상점' : '벌점'}
          </span>
        ),
      },
      {
        key: 'ruleCategory',
        header: '카테고리',
        render: (row) => <span>{row.ruleCategory}</span>,
      },
      {
        key: 'ruleName',
        header: '항목',
        render: (row) => (
          <span
            style={{
              display: 'block',
              maxWidth: '120px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {row.ruleName}
          </span>
        ),
      },
      {
        key: 'score',
        header: '점수',
        render: (row) => (
          <span
            style={{
              fontFamily: 'var(--font-space-grotesk)',
              fontWeight: 600,
              color:
                row.type === 'reward' ? 'var(--reward)' : 'var(--penalty)',
            }}
          >
            {row.type === 'reward' ? '+' : '-'}
            {row.score}
          </span>
        ),
      },
      {
        key: 'awardedAt',
        header: '일시',
        render: (row) => (
          <span style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            {formatAwardedAtParts(row.awardedAt).date}
          </span>
        ),
      },
      {
        key: 'teacherName',
        header: '담당교사',
        render: (row) => <span>{row.teacherName}</span>,
      },
    ],
    [],
  )

  return (
    <DataTable
      columns={columns}
      data={entries}
      rowKey={(row) => row.id}
    />
  )
}
