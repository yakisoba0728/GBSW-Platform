'use client'

import { formatAwardedAtParts, formatSignedScore, getSchoolLabel } from './teacher-shared'
import { AnimatedTableRow, ListEmptyState, TableRowSkeleton } from '../ui/list'
import { EditIcon, TrashIcon } from '../ui/icons'
import { FetchingOverlay, IconButton, MileageBadge, Pagination } from '../ui/primitives'
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
        <FetchingOverlay visible={isFetching && !isLoading} />

        <table
          className="w-full min-w-[800px] table-fixed"
          style={{
            fontFamily: 'var(--font-noto-sans-kr), sans-serif',
            opacity: isFetching && !isLoading ? 0.35 : 1,
            transition: 'opacity 200ms',
          }}
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
            {isLoading ? (
              <TableRowSkeleton columns={7} count={8} />
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ verticalAlign: 'middle', height: '220px' }}>
                  <ListEmptyState
                    icon={
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent)' }} aria-hidden="true">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    }
                    title="조회 결과가 없습니다"
                    description="필터 조건을 변경해 보세요."
                  />
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
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
                    <p className="truncate text-[13px] font-medium" style={{ color: 'var(--fg)' }}>{item.ruleName}</p>
                    <p className="mt-0.5 truncate text-[11px]" style={{ color: 'var(--fg-muted)' }}>{item.ruleCategory}</p>
                  </td>

                  {/* 사유 */}
                  <td className="py-2 pr-3 text-[11px]">
                    {item.reason?.trim() ? (
                      <div className="group relative">
                        <div className="truncate" style={{ color: 'var(--fg-muted)' }}>
                          {item.reason.trim()}
                        </div>
                        <div
                          className="pointer-events-none absolute bottom-full left-0 z-20 mb-1.5 hidden w-max max-w-[240px] rounded-md border px-2.5 py-2 text-xs shadow-sm group-hover:block"
                          style={{
                            backgroundColor: 'var(--bg-subtle)',
                            borderColor: 'var(--border)',
                            color: 'var(--fg)',
                            fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                            whiteSpace: 'normal',
                            wordBreak: 'break-word',
                            lineHeight: '1.5',
                          }}
                        >
                          {item.reason.trim()}
                        </div>
                      </div>
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
              ))
            )}
          </tbody>
        </table>
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
