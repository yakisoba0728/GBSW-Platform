'use client'

import { useMemo } from 'react'
import { DataTable, type DataTableColumn } from '../ui/data-table'
import { formatAwardedAtParts, getSchoolLabel } from '../mileage/shared'
import { EditIcon, SearchIcon, TrashIcon } from '../ui/icons'
import Tooltip from '../ui/tooltip'
import { IconButton, MileageBadge, Pagination, RefetchWrapper } from '../ui/primitives'
import type { SharedMileageHistoryItem } from './shared-mileage-types'

type Props<T extends SharedMileageHistoryItem> = {
  items: T[]
  isLoading: boolean
  isFetching: boolean
  page: number
  pageCount: number
  totalCount: number
  onEdit?: (item: T) => void
  onDelete?: (item: T) => void
  onPageChange: (page: number) => void
  animated?: boolean
}

export default function HistoryTable<T extends SharedMileageHistoryItem>({
  items,
  isLoading,
  isFetching,
  page,
  pageCount,
  totalCount,
  onEdit,
  onDelete,
  onPageChange,
  animated = true,
}: Props<T>) {
  const columns = useMemo<DataTableColumn<T>[]>(
    () => [
      {
        key: 'awardedAt',
        header: '\uBD80\uC5EC \uC77C\uC2DC',
        width: 108,
        render: (item) => {
          const { date, time } = formatAwardedAtParts(item.awardedAt)
          return (
            <div
              style={{
                fontSize: '11px',
                borderLeft: `2px solid ${item.type === 'reward' ? 'var(--reward)' : 'var(--penalty)'}`,
                paddingLeft: '10px',
              }}
            >
              <p style={{ color: 'var(--fg-muted)', whiteSpace: 'nowrap' }}>{date}</p>
              <p style={{ color: 'var(--fg-muted)', opacity: 0.6, whiteSpace: 'nowrap', marginTop: '2px' }}>
                {time}
              </p>
            </div>
          )
        },
      },
      {
        key: 'student',
        header: '\uD559\uC0DD',
        width: 200,
        render: (item) => (
          <div style={{ overflow: 'hidden' }}>
            <div className="flex min-w-0 items-baseline gap-1">
              <p
                className="truncate text-[13px] font-semibold"
                style={{ color: 'var(--fg)', flexShrink: 0, maxWidth: '55%' }}
              >
                {item.studentName}
              </p>
              <p className="truncate text-[11px]" style={{ color: 'var(--fg-muted)' }}>
                {item.grade ? `${item.grade}\uD559\uB144 ` : ''}
                {item.classNumber}\uBC18 {item.studentNumber}\uBC88
              </p>
            </div>
            <p className="mt-0.5 truncate text-[11px]" style={{ color: 'var(--fg-muted)' }}>
              {item.school ? `${getSchoolLabel(item.school)} \u00B7 ` : ''}
              {item.studentId}
            </p>
          </div>
        ),
      },
      {
        key: 'score',
        header: '\uC810\uC218',
        width: 68,
        render: (item) => <MileageBadge type={item.type} score={item.score} />,
      },
      {
        key: 'rule',
        header: '\uADDC\uC815 \uD56D\uBAA9',
        width: 190,
        render: (item) => (
          <Tooltip content={`${item.ruleName} \u2014 ${item.ruleCategory}`}>
            <div style={{ overflow: 'hidden' }}>
              <p className="truncate text-[13px] font-medium" style={{ color: 'var(--fg)' }}>
                {item.ruleName}
              </p>
              <p className="mt-0.5 truncate text-[11px]" style={{ color: 'var(--fg-muted)' }}>
                {item.ruleCategory}
              </p>
            </div>
          </Tooltip>
        ),
      },
      {
        key: 'reason',
        header: '\uC0AC\uC720',
        width: 118,
        render: (item) =>
          item.reason?.trim() ? (
            <Tooltip content={item.reason.trim()}>
              <span
                className="block truncate text-[11px]"
                style={{ color: 'var(--fg-muted)' }}
              >
                {item.reason.trim()}
              </span>
            </Tooltip>
          ) : (
            <span style={{ color: 'var(--fg-muted)', opacity: 0.4 }}>&mdash;</span>
          ),
      },
      {
        key: 'teacher',
        header: '\uBD80\uC5EC \uAD50\uC0AC',
        width: 110,
        render: (item) => (
          <div style={{ overflow: 'hidden' }}>
            <p className="truncate text-[11px]" style={{ color: 'var(--fg-muted)' }}>
              {item.teacherName}
            </p>
            <p
              className="mt-0.5 truncate text-[11px]"
              style={{ color: 'var(--fg-muted)', opacity: 0.6 }}
            >
              {item.teacherId}
            </p>
          </div>
        ),
      },
      {
        key: 'actions',
        header: '',
        width: 56,
        render: (item) =>
          (onEdit || onDelete) ? (
            <div className="flex items-center gap-1">
              {onEdit && <IconButton icon={<EditIcon />} label="\uD3B8\uC9D1" onClick={() => onEdit(item)} />}
              {onDelete && (
                <IconButton
                  icon={<TrashIcon />}
                  label="\uC0AD\uC81C"
                  variant="danger"
                  onClick={() => onDelete(item)}
                />
              )}
            </div>
          ) : null,
      },
    ],
    [onEdit, onDelete],
  )

  return (
    <>
      <div className="relative hidden min-h-0 flex-1 overflow-x-auto overflow-y-auto md:block">
        {isLoading ? (
          <DataTable columns={columns} data={[]} rowKey={() => 0} loading />
        ) : (
          <RefetchWrapper
            isFetching={isFetching}
            isInitialLoad={false}
            className="h-full"
            contentClassName="h-full"
          >
            <DataTable
              columns={columns}
              data={items}
              rowKey={(item) => item.id}
              emptyIcon={<SearchIcon size={20} style={{ color: 'var(--accent)' }} />}
              emptyTitle="\uC870\uD68C \uACB0\uACFC\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4"
              emptyDescription="\uD544\uD130 \uC870\uAC74\uC744 \uBCC0\uACBD\uD574 \uBCF4\uC138\uC694."
              animated={animated}
            />
          </RefetchWrapper>
        )}
      </div>

      {!isLoading && (
        <Pagination
          page={page}
          pageCount={pageCount}
          totalCount={totalCount}
          onChange={onPageChange}
        />
      )}
    </>
  )
}
