'use client'

import { useMemo } from 'react'
import { DataTable, type DataTableColumn } from '../ui/data-table'

type SharedClassSummary = {
  classNumber: number
  studentCount: number
  rewardTotal: number
  penaltyTotal: number
  netScore: number
  avgNetScore: number
}

export default function ClassReportTable({
  classes,
}: {
  classes: SharedClassSummary[]
}) {
  const columns = useMemo<DataTableColumn<SharedClassSummary>[]>(
    () => [
      {
        key: 'classNumber',
        header: '반',
        render: (row) => (
          <span
            style={{
              fontFamily: 'var(--font-space-grotesk)',
              fontWeight: 600,
            }}
          >
            {row.classNumber}반
          </span>
        ),
      },
      {
        key: 'studentCount',
        header: '학생 수',
        render: (row) => (
          <span style={{ fontFamily: 'var(--font-space-grotesk)' }}>
            {row.studentCount}명
          </span>
        ),
      },
      {
        key: 'rewardTotal',
        header: '상점 합계',
        render: (row) => (
          <span
            style={{
              fontFamily: 'var(--font-space-grotesk)',
              fontWeight: 600,
              color: 'var(--reward)',
            }}
          >
            +{row.rewardTotal}
          </span>
        ),
      },
      {
        key: 'penaltyTotal',
        header: '벌점 합계',
        render: (row) => (
          <span
            style={{
              fontFamily: 'var(--font-space-grotesk)',
              fontWeight: 600,
              color: 'var(--penalty)',
            }}
          >
            -{row.penaltyTotal}
          </span>
        ),
      },
      {
        key: 'netScore',
        header: '순점수 합',
        render: (row) => (
          <span
            style={{
              fontFamily: 'var(--font-space-grotesk)',
              fontWeight: 700,
              color:
                row.netScore >= 0 ? 'var(--reward)' : 'var(--penalty)',
            }}
          >
            {row.netScore >= 0 ? '+' : ''}
            {row.netScore}
          </span>
        ),
      },
      {
        key: 'avgNetScore',
        header: '1인 평균',
        render: (row) => (
          <span
            style={{
              fontFamily: 'var(--font-space-grotesk)',
              color:
                row.avgNetScore >= 0 ? 'var(--reward)' : 'var(--penalty)',
            }}
          >
            {row.avgNetScore >= 0 ? '+' : ''}
            {row.avgNetScore}
          </span>
        ),
      },
    ],
    [],
  )

  return (
    <DataTable
      columns={columns}
      data={classes}
      rowKey={(row) => row.classNumber}
    />
  )
}
