'use client'

import { formatAwardedAt, getSchoolLabel } from './teacher-shared'
import { AnimatedListItem, ListEmptyState, ListSkeleton } from '../ui/list'
import { EditIcon, TrashIcon } from '../ui/icons'
import { FetchingOverlay, IconButton, MileageBadge } from '../ui/primitives'
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
    <div className="relative min-h-0 flex-1 overflow-y-auto pr-0.5 md:hidden">
      <FetchingOverlay visible={isFetching && !isLoading} />

      {isLoading ? (
        <ListSkeleton count={6} rowHeight="h-24" />
      ) : items.length === 0 ? (
        <div
          className="flex h-full items-center justify-center"
          style={{ opacity: isFetching ? 0.35 : 1, transition: 'opacity 200ms' }}
        >
          <ListEmptyState
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--admin-accent)' }} aria-hidden="true">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            }
            title="조회 결과가 없습니다"
            description="필터 조건을 변경해 보세요."
          />
        </div>
      ) : (
        <div
          className="space-y-2"
          style={{ opacity: isFetching ? 0.35 : 1, transition: 'opacity 200ms' }}
        >
          {items.map((item, index) => (
            <AnimatedListItem
              key={item.id}
              index={index}
              className="rounded-lg border px-3.5 py-3"
              style={{
                borderColor: 'var(--admin-border)',
                backgroundColor: 'var(--admin-bg)',
                borderLeft: `2px solid ${item.type === 'reward' ? 'var(--mileage-green)' : 'var(--mileage-red)'}`,
              }}
            >
              {/* 헤더: 학생 정보 + 액션 */}
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span
                      className="text-[13px] font-semibold"
                      style={{ color: 'var(--admin-text)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
                    >
                      {item.studentName}
                    </span>
                    <span
                      className="text-[11px]"
                      style={{ color: 'var(--admin-text-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
                    >
                      {item.grade ? `${item.grade}학년 ` : ''}{item.classNumber}반 {item.studentNumber}번
                    </span>
                  </div>
                  <p
                    className="mt-0.5 text-[11px]"
                    style={{ color: 'var(--admin-text-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
                  >
                    {getSchoolLabel(item.school)} · {item.studentId}
                  </p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-1">
                  <IconButton icon={<EditIcon />} label="편집" onClick={() => onEdit(item)} />
                  <IconButton icon={<TrashIcon />} label="삭제" variant="danger" onClick={() => onDelete(item)} />
                </div>
              </div>

              {/* 점수 + 규정 */}
              <div className="mb-1.5 flex items-center gap-2">
                <MileageBadge type={item.type} score={item.score} />
                <span
                  className="min-w-0 flex-1 truncate text-[12px] font-medium"
                  style={{ color: 'var(--admin-text)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
                >
                  {item.ruleName}
                </span>
              </div>

              {/* 카테고리 + 일시 */}
              <p
                className="text-[11px]"
                style={{ color: 'var(--admin-text-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
              >
                {item.ruleCategory} · {formatAwardedAt(item.awardedAt)}
                {item.teacherName ? ` · ${item.teacherName}` : ''}
              </p>

              {item.reason?.trim() && (
                <p
                  className="mt-1 text-[11px]"
                  style={{ color: 'var(--admin-text-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
                >
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
