'use client'

import {
  formatAwardedAt,
  formatSignedScore,
  getSchoolLabel,
} from './teacher-shared'
import { AnimatedListItem, ListEmptyState, ListSkeleton } from '../ui/list'
import { EditIcon, TrashIcon } from '../ui/icons'
import type { SchoolMileageHistoryItem } from './school-mileage-types'

export default function HistoryMobileList({
  items,
  isLoading,
  isFetching,
  onEdit,
  onDelete,
}: {
  items: SchoolMileageHistoryItem[]
  isLoading: boolean
  isFetching: boolean
  onEdit: (item: SchoolMileageHistoryItem) => void
  onDelete: (item: SchoolMileageHistoryItem) => void
}) {
  return (
    <div
      className="relative flex-1 min-h-0 overflow-y-auto pr-0.5 md:hidden"
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
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="animate-spin flex-shrink-0"
              style={{ color: 'var(--admin-accent)' }}
              aria-hidden="true"
            >
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            <span
              className="text-xs font-medium"
              style={{
                color: 'var(--admin-text-muted)',
                fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              }}
            >
              조회 중
            </span>
          </div>
        </div>
      )}
      {isLoading ? (
        <ListSkeleton count={6} rowHeight="h-24" />
      ) : items.length === 0 ? (
        <div
          className="flex h-full items-center justify-center"
          style={{ opacity: isFetching ? 0.35 : 1, transition: 'opacity 200ms' }}
        >
          <ListEmptyState
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--admin-accent)' }} aria-hidden="true">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            }
            title="조회 결과가 없습니다"
            description="필터 조건을 변경해 보세요."
          />
        </div>
      ) : (
        <div className="space-y-2" style={{ opacity: isFetching ? 0.35 : 1, transition: 'opacity 200ms' }}>
          {items.map((item, index) => (
            <AnimatedListItem
              key={item.id}
              index={index}
              className="rounded-xl border px-4 py-3.5"
              style={{
                borderColor: 'var(--admin-border)',
                backgroundColor: 'var(--admin-bg)',
                borderLeft: `3px solid ${item.type === 'reward' ? '#16a34a' : '#dc2626'}`,
              }}
            >
              <div className="mb-2.5 flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-sm font-semibold" style={{ color: 'var(--admin-text)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
                      {item.studentName}
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--admin-text-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
                      {item.grade ? `${item.grade}학년 ` : ''}{item.classNumber}반 {item.studentNumber}번
                    </span>
                  </div>
                  <div className="mt-0.5 text-[11px]" style={{ color: 'var(--admin-text-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
                    {getSchoolLabel(item.school)} · {item.studentId}
                  </div>
                </div>
                <div className="flex flex-shrink-0 items-center gap-1">
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
              </div>

              <div className="mb-1.5 flex items-center gap-2">
                <span
                  className="flex-shrink-0 rounded-md px-2 py-0.5 text-xs font-bold"
                  style={{
                    backgroundColor: item.type === 'reward' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                    color: item.type === 'reward' ? '#15803d' : '#b91c1c',
                    border: `1px solid ${item.type === 'reward' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    fontFamily: 'var(--font-space-grotesk)',
                  }}
                >
                  {formatSignedScore(item.type, item.score)}
                </span>
                <span className="min-w-0 flex-1 truncate text-xs font-medium" style={{ color: 'var(--admin-text)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
                  {item.ruleName}
                </span>
              </div>
              <p className="mb-1.5 text-[11px]" style={{ color: 'var(--admin-text-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
                {item.ruleCategory}
              </p>
              <p className="text-[11px]" style={{ color: 'var(--admin-text-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
                {formatAwardedAt(item.awardedAt)}
                {item.teacherName ? ` · 부여: ${item.teacherName} (${item.teacherId})` : ''}
              </p>
              {item.reason?.trim() && (
                <p className="mt-1 text-[11px]" style={{ color: 'var(--admin-text-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
                  사유: {item.reason}
                </p>
              )}
            </AnimatedListItem>
          ))}
        </div>
      )}
    </div>
  )
}
