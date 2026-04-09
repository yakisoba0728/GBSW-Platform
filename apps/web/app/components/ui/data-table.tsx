'use client'

import type { CSSProperties, KeyboardEvent, ReactNode } from 'react'
import { AnimatedTableRow, EmptyStatePane, TableRowSkeleton } from './list'
import { Pagination } from './primitives'

// ─── Types ───────────────────────────────────────────────────────────────────

export type DataTableColumn<T> = {
  key: string
  header: string
  width?: number | string
  align?: 'left' | 'center' | 'right'
  render: (row: T, index: number) => ReactNode
}

type DataTablePagination = {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
}

type DataTableProps<T> = {
  columns: DataTableColumn<T>[]
  data: T[]
  rowKey: (row: T) => string | number
  loading?: boolean
  emptyIcon?: ReactNode
  emptyTitle?: string
  emptyDescription?: string
  pagination?: DataTablePagination
  onRowClick?: (row: T) => void
  stickyHeader?: boolean
  animated?: boolean
  className?: string
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const tableStyle: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  fontFamily: 'var(--font-noto-sans-kr), sans-serif',
}

const headerCellStyle: CSSProperties = {
  padding: '10px 14px',
  fontSize: '12px',
  fontWeight: 600,
  fontFamily: 'var(--font-noto-sans-kr), sans-serif',
  color: 'var(--fg-muted)',
  backgroundColor: 'var(--bg-subtle)',
  borderBottom: '1px solid var(--border)',
  textAlign: 'left',
  whiteSpace: 'nowrap',
}

const stickyHeaderStyle: CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 1,
}

const cellStyle: CSSProperties = {
  padding: '10px 14px',
  fontSize: '13px',
  fontFamily: 'var(--font-noto-sans-kr), sans-serif',
  color: 'var(--fg)',
}

const rowBorderStyle: CSSProperties = {
  borderBottom: '1px solid var(--border)',
}

const clickableRowStyle: CSSProperties = {
  cursor: 'pointer',
}

const clickableCellButtonStyle: CSSProperties = {
  width: '100%',
  border: 'none',
  background: 'transparent',
  padding: 0,
  color: 'inherit',
  textAlign: 'inherit',
  cursor: 'pointer',
  font: 'inherit',
}

// ─── DataTable ───────────────────────────────────────────────────────────────
// Generic, reusable table component for the design system.
// Replaces inline table implementations with a declarative column + data API.

export function DataTable<T>({
  columns,
  data,
  rowKey,
  loading = false,
  emptyIcon,
  emptyTitle = '데이터가 없습니다',
  emptyDescription,
  pagination,
  onRowClick,
  stickyHeader = false,
  animated = true,
  className = '',
}: DataTableProps<T>) {
  const pageCount = pagination
    ? Math.max(1, Math.ceil(pagination.total / pagination.pageSize))
    : 1

  // ── Loading state ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={className}>
        <table style={tableStyle}>
          <colgroup>
            {columns.map((col) => (
              <col
                key={col.key}
                style={col.width != null ? { width: col.width } : undefined}
              />
            ))}
          </colgroup>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  style={{
                    ...headerCellStyle,
                    ...(stickyHeader ? stickyHeaderStyle : {}),
                    ...(col.align ? { textAlign: col.align } : {}),
                  }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <TableRowSkeleton columns={columns.length} count={6} />
          </tbody>
        </table>
      </div>
    )
  }

  // ── Empty state ────────────────────────────────────────────────────────
  if (data.length === 0) {
    return (
      <div className={className}>
        <EmptyStatePane
          icon={emptyIcon}
          title={emptyTitle}
          description={emptyDescription}
        />
      </div>
    )
  }

  // ── Data state ─────────────────────────────────────────────────────────
  return (
    <div className={className}>
      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <colgroup>
            {columns.map((col) => (
              <col
                key={col.key}
                style={col.width != null ? { width: col.width } : undefined}
              />
            ))}
          </colgroup>
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  style={{
                    ...headerCellStyle,
                    ...(stickyHeader ? stickyHeaderStyle : {}),
                    ...(col.align ? { textAlign: col.align } : {}),
                  }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <AnimatedTableRow
                key={rowKey(row)}
                index={index}
                animated={animated}
                style={{
                  ...rowBorderStyle,
                  ...(onRowClick ? clickableRowStyle : {}),
                }}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={onRowClick ? (e: KeyboardEvent<HTMLTableRowElement>) => { if (e.key === 'Enter') onRowClick(row) } : undefined}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    style={{
                      ...cellStyle,
                      ...(col.align ? { textAlign: col.align } : {}),
                    }}
                  >
                    {onRowClick && col.key === columns[0]?.key ? (
                      <button
                        type="button"
                        onClick={() => onRowClick(row)}
                        style={clickableCellButtonStyle}
                        aria-label={`${rowKey(row)} 상세 보기`}
                      >
                        {col.render(row, index)}
                      </button>
                    ) : (
                      col.render(row, index)
                    )}
                  </td>
                ))}
              </AnimatedTableRow>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && (
        <Pagination
          page={pagination.page}
          pageCount={pageCount}
          totalCount={pagination.total}
          onChange={pagination.onPageChange}
        />
      )}
    </div>
  )
}
