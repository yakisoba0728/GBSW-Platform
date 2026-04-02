'use client'

import {
  formatAwardedAtParts,
  formatSignedScore,
  getSchoolLabel,
} from './teacher-shared'
import {
  AnimatedTableRow,
  ListEmptyState,
  TableRowSkeleton,
} from '../ui/list'
import { EditIcon, TrashIcon } from '../ui/icons'
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
      <div
        className="relative hidden overflow-x-auto overflow-y-auto md:block"
        style={{ height: 'calc(100dvh - 310px)', minHeight: '200px' }}
      >
        {isFetching && !isLoading && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center animate-fade-in">
            <div
              className="flex items-center gap-2 rounded-xl border px-3.5 py-2 shadow-lg"
              style={{
                backgroundColor: 'var(--admin-sidebar-bg)',
                borderColor: 'var(--admin-border)',
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="animate-spin flex-shrink-0" style={{ color: 'var(--admin-accent)' }} aria-hidden="true">
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
              <span className="text-xs font-medium" style={{ color: 'var(--admin-text-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>조회 중</span>
            </div>
          </div>
        )}
        <table className="w-full min-w-[820px] table-fixed text-sm" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', opacity: isFetching && !isLoading ? 0.35 : 1, transition: 'opacity 200ms' }}>
          <colgroup>
            <col style={{ width: 110 }} />
            <col style={{ width: 206 }} />
            <col style={{ width: 58 }} />
            <col style={{ width: 196 }} />
            <col style={{ width: 120 }} />
            <col style={{ width: 80 }} />
            <col style={{ width: 60 }} />
          </colgroup>
          <thead>
            <tr>
              {['부여 일시', '학생', '점수', '규정 항목', '사유', '부여 교사', ''].map((header) => (
                <th
                  key={header}
                  className="pb-3 pr-3 text-left text-xs font-medium"
                  style={{
                    color: 'var(--admin-text-muted)',
                    position: 'sticky',
                    top: 0,
                    backgroundColor: 'var(--admin-sidebar-bg)',
                    zIndex: 1,
                    boxShadow: 'inset 0 -1px 0 var(--admin-border)',
                  }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableRowSkeleton columns={7} count={6} />
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ height: 'calc(100dvh - 370px)', minHeight: '160px', verticalAlign: 'middle' }}>
                  <ListEmptyState
                    icon={
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--admin-accent)' }} aria-hidden="true">
                        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    }
                    title="조회 결과가 없습니다"
                    description="필터 조건을 변경해 보세요."
                  />
                </td>
              </tr>
            ) : items.map((item, index) => (
              <AnimatedTableRow
                key={item.id}
                index={index}
                className="transition-colors hover:bg-black/[0.025] dark:hover:bg-white/[0.025]"
                style={{ borderBottom: '1px solid var(--admin-border)' }}
              >
                <td className="py-3 pr-3 text-xs" style={{ borderLeft: `2px solid ${item.type === 'reward' ? '#16a34a' : '#dc2626'}`, paddingLeft: '10px' }}>
                  {(() => {
                    const { date, time } = formatAwardedAtParts(item.awardedAt)
                    return (
                      <>
                        <p style={{ color: 'var(--admin-text-muted)', whiteSpace: 'nowrap' }}>{date}</p>
                        <p className="mt-0.5" style={{ color: 'var(--admin-text-muted)', opacity: 0.65, whiteSpace: 'nowrap' }}>{time}</p>
                      </>
                    )
                  })()}
                </td>
                <td className="overflow-hidden py-3 pr-3">
                  <div className="flex min-w-0 items-baseline gap-1">
                    <p className="truncate text-sm font-semibold" style={{ color: 'var(--admin-text)', flexShrink: 0, maxWidth: '55%' }}>
                      {item.studentName}
                    </p>
                    <p className="truncate text-[11px]" style={{ color: 'var(--admin-text-muted)' }}>
                      {item.grade ? `${item.grade}학년 ` : ''}{item.classNumber}반 {item.studentNumber}번
                    </p>
                  </div>
                  <p className="mt-0.5 truncate text-[11px]" style={{ color: 'var(--admin-text-muted)' }}>
                    {getSchoolLabel(item.school)} · {item.studentId}
                  </p>
                </td>
                <td className="py-3 pr-3" style={{ whiteSpace: 'nowrap' }}>
                  <span
                    className="rounded-md px-2 py-0.5 text-xs font-bold"
                    style={{
                      backgroundColor: item.type === 'reward' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                      color: item.type === 'reward' ? '#15803d' : '#b91c1c',
                      border: `1px solid ${item.type === 'reward' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                      fontFamily: 'var(--font-space-grotesk)',
                    }}
                  >
                    {formatSignedScore(item.type, item.score)}
                  </span>
                </td>
                <td className="overflow-hidden py-3 pr-3">
                  <p className="truncate font-medium" style={{ color: 'var(--admin-text)' }}>{item.ruleName}</p>
                  <p className="mt-0.5 truncate text-[11px]" style={{ color: 'var(--admin-text-muted)' }}>{item.ruleCategory}</p>
                </td>
                <td className="py-3 pr-3 text-xs">
                  {item.reason?.trim() ? (
                    <div className="group relative">
                      <div className="overflow-hidden">
                        <div className="truncate" style={{ color: 'var(--admin-text-muted)' }}>
                          {item.reason.trim()}
                        </div>
                      </div>
                      <div
                        className="pointer-events-none absolute bottom-full left-0 z-20 mb-1.5 hidden w-max max-w-[260px] rounded-lg px-3 py-2 text-xs shadow-lg group-hover:block"
                        style={{
                          backgroundColor: 'var(--admin-sidebar-bg)',
                          border: '1px solid var(--admin-border)',
                          color: 'var(--admin-text)',
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
                    <span style={{ color: 'var(--admin-text-muted)' }}>—</span>
                  )}
                </td>
                <td className="overflow-hidden py-3 pr-3 text-xs">
                  <p className="truncate" style={{ color: 'var(--admin-text-muted)' }}>{item.teacherName}</p>
                  <p className="mt-0.5 truncate text-[11px]" style={{ color: 'var(--admin-text-muted)', opacity: 0.7 }}>{item.teacherId}</p>
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEdit(item)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors hover:opacity-70"
                      style={{ borderColor: 'var(--admin-border)', color: 'var(--admin-text-muted)' }}
                      aria-label="편집"
                    >
                      <EditIcon />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(item)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors hover:opacity-70"
                      style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#dc2626' }}
                      aria-label="삭제"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </td>
              </AnimatedTableRow>
            ))}
          </tbody>
        </table>
      </div>

      {!isLoading && (
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text-muted)' }}>
            총 <span style={{ color: 'var(--admin-text)', fontWeight: 600 }}>{totalCount.toLocaleString()}</span>건
          </p>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              style={{ borderColor: 'var(--admin-border)', color: 'var(--admin-text-muted)' }}
              aria-label="이전 페이지"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(pageCount, 5) }, (_, index) => {
                let pageNumber: number
                if (pageCount <= 5) pageNumber = index + 1
                else if (page <= 3) pageNumber = index + 1
                else if (page >= pageCount - 2) pageNumber = pageCount - 4 + index
                else pageNumber = page - 2 + index

                return (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => onPageChange(pageNumber)}
                    className="h-8 min-w-[32px] rounded-lg border px-1.5 text-sm font-medium transition-colors"
                    style={
                      pageNumber === page
                        ? { backgroundColor: 'var(--admin-accent)', color: '#fff', borderColor: 'var(--admin-accent)', fontFamily: 'var(--font-space-grotesk)' }
                        : { color: 'var(--admin-text-muted)', borderColor: 'var(--admin-border)', fontFamily: 'var(--font-space-grotesk)' }
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
              style={{ borderColor: 'var(--admin-border)', color: 'var(--admin-text-muted)' }}
              aria-label="다음 페이지"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
