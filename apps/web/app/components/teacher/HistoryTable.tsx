'use client'

import { formatAwardedAtParts, getSchoolLabel } from './teacher-shared'
import {
  AnimatedTableRow,
  EmptyStatePane,
  TableRowSkeleton,
} from '../ui/list'
import { EditIcon, SearchIcon, TrashIcon } from '../ui/icons'
import Tooltip from '../ui/tooltip'
import { IconButton, MileageBadge, Pagination, RefetchWrapper } from '../ui/primitives'
import type { SchoolMileageHistoryItem } from './school-mileage-types'

export default function HistoryTable({
  items,
  isLoading,
  isFetching,
  page,
  pageCount,
  totalCount,
  onEdit,
  onDelete,
  onPageChange,
}: {
  items: SchoolMileageHistoryItem[]
  isLoading: boolean
  isFetching: boolean
  page: number
  pageCount: number
  totalCount: number
  onEdit: (item: SchoolMileageHistoryItem) => void
  onDelete: (item: SchoolMileageHistoryItem) => void
  onPageChange: (page: number) => void
  }) {
  return (
    <>
      <div className="relative hidden min-h-0 flex-1 overflow-x-auto overflow-y-auto md:block">
        {isLoading ? (
          <table
            className="w-full min-w-[800px] table-fixed"
            style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
          >
            <colgroup>
              <col style={{ width: 108 }} />
              <col style={{ width: 200 }} />
              <col style={{ width: 68 }} />
              <col style={{ width: 190 }} />
              <col style={{ width: 118 }} />
              <col style={{ width: 110 }} />
              <col style={{ width: 56 }} />
            </colgroup>

            <thead className="table-header">
              <tr>
                {['부여 일시', '학생', '점수', '규정 항목', '사유', '부여 교사', ''].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              <TableRowSkeleton columns={7} count={8} />
            </tbody>
          </table>
        ) : items.length === 0 ? (
          <EmptyStatePane
            className="h-full"
            icon={<SearchIcon size={20} style={{ color: 'var(--accent)' }} />}
            title="조회 결과가 없습니다"
            description="필터 조건을 변경해 보세요."
          />
        ) : (
          <RefetchWrapper
            isFetching={isFetching}
            isInitialLoad={false}
            className="h-full"
            contentClassName="h-full"
          >
            <table
              className="w-full min-w-[800px] table-fixed"
              style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
            >
              <colgroup>
                <col style={{ width: 108 }} />
                <col style={{ width: 200 }} />
                <col style={{ width: 68 }} />
                <col style={{ width: 190 }} />
                <col style={{ width: 118 }} />
                <col style={{ width: 110 }} />
                <col style={{ width: 56 }} />
              </colgroup>

              <thead className="table-header">
                <tr>
                  {['부여 일시', '학생', '점수', '규정 항목', '사유', '부여 교사', ''].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {items.map((item, index) => (
                  <AnimatedTableRow
                    key={item.id}
                    index={index}
                    className="transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                    style={{ borderBottom: '1px solid var(--border)' }}
                  >
                    {/* 일시 */}
                    <td
                      className="py-2 pr-3 text-[11px]"
                      style={{
                        borderLeft: `2px solid ${item.type === 'reward' ? 'var(--reward)' : 'var(--penalty)'}`,
                        paddingLeft: '10px',
                      }}
                    >
                      {(() => {
                        const { date, time } = formatAwardedAtParts(item.awardedAt)
                        return (
                          <>
                            <p style={{ color: 'var(--fg-muted)', whiteSpace: 'nowrap' }}>{date}</p>
                            <p className="mt-0.5" style={{ color: 'var(--fg-muted)', opacity: 0.6, whiteSpace: 'nowrap' }}>{time}</p>
                          </>
                        )
                      })()}
                    </td>

                    {/* 학생 */}
                    <td className="overflow-hidden py-2 pr-3">
                      <div className="flex min-w-0 items-baseline gap-1">
                        <p className="truncate text-[13px] font-semibold" style={{ color: 'var(--fg)', flexShrink: 0, maxWidth: '55%' }}>
                          {item.studentName}
                        </p>
                        <p className="truncate text-[11px]" style={{ color: 'var(--fg-muted)' }}>
                          {item.grade ? `${item.grade}학년 ` : ''}{item.classNumber}반 {item.studentNumber}번
                        </p>
                      </div>
                      <p className="mt-0.5 truncate text-[11px]" style={{ color: 'var(--fg-muted)' }}>
                        {getSchoolLabel(item.school)} · {item.studentId}
                      </p>
                    </td>

                    {/* 점수 */}
                    <td className="py-2 pr-3" style={{ whiteSpace: 'nowrap' }}>
                      <MileageBadge type={item.type} score={item.score} />
                    </td>

                    {/* 규정 항목 */}
                    <td className="overflow-hidden py-2 pr-3">
                      <Tooltip content={`${item.ruleName} — ${item.ruleCategory}`}>
                        <div>
                          <p className="truncate text-[13px] font-medium" style={{ color: 'var(--fg)' }}>{item.ruleName}</p>
                          <p className="mt-0.5 truncate text-[11px]" style={{ color: 'var(--fg-muted)' }}>{item.ruleCategory}</p>
                        </div>
                      </Tooltip>
                    </td>

                    {/* 사유 */}
                    <td className="py-2 pr-3 text-[11px]">
                      {item.reason?.trim() ? (
                        <Tooltip content={item.reason.trim()}>
                          <span className="block truncate" style={{ color: 'var(--fg-muted)' }}>
                            {item.reason.trim()}
                          </span>
                        </Tooltip>
                      ) : (
                        <span style={{ color: 'var(--fg-muted)', opacity: 0.4 }}>—</span>
                      )}
                    </td>

                    {/* 부여 교사 */}
                    <td className="overflow-hidden py-2 pr-3 text-[11px]">
                      <p className="truncate" style={{ color: 'var(--fg-muted)' }}>{item.teacherName}</p>
                      <p className="mt-0.5 truncate text-[11px]" style={{ color: 'var(--fg-muted)', opacity: 0.6 }}>{item.teacherId}</p>
                    </td>

                    {/* 액션 */}
                    <td className="py-2">
                      <div className="flex items-center gap-1">
                        <IconButton icon={<EditIcon />} label="편집" onClick={() => onEdit(item)} />
                        <IconButton icon={<TrashIcon />} label="삭제" variant="danger" onClick={() => onDelete(item)} />
                      </div>
                    </td>
                  </AnimatedTableRow>
                ))}
              </tbody>
            </table>
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
