'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { formatAwardedAt, formatSignedScore } from '../mileage/shared'
import { EmptyStatePane, ListSkeleton } from '../ui/list'
import { SearchIcon } from '../ui/icons'
import {
  getMicroInteractionTransition,
  useMotionPreference,
} from '../ui/motion'
import { RefetchWrapper } from '../ui/primitives'
import type {
  DormMileageHistoryItem,
  DormStudentMileageSummary,
  MileageType,
} from './dorm-mileage-types'

const DETAIL_FETCH_PAGE_SIZE = 100

type CategoryStat = {
  category: string
  type: MileageType
  count: number
  totalScore: number
}

function CategoryBar({
  label,
  count,
  totalScore,
  maxCount,
  type,
  mounted,
}: {
  label: string
  count: number
  totalScore: number
  maxCount: number
  type: MileageType
  mounted: boolean
}) {
  const pct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0
  const barColor = type === 'reward' ? 'var(--reward)' : 'var(--penalty)'

  return (
    <div className="flex items-center gap-3 py-1">
      <span
        className="w-[90px] flex-shrink-0 truncate text-[11px]"
        style={{
          fontFamily: 'var(--font-noto-sans-kr), sans-serif',
          color: 'var(--fg)',
        }}
      >
        {label}
      </span>
      <div
        className="h-1.5 flex-1 overflow-hidden rounded-full"
        style={{ backgroundColor: 'var(--border)' }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: mounted ? `${pct}%` : '0%',
            backgroundColor: barColor,
            transition: 'width 600ms cubic-bezier(0.16,1,0.3,1)',
          }}
        />
      </div>
      <div
        className="flex w-[70px] flex-shrink-0 justify-end gap-1.5 text-[10px]"
        style={{ fontFamily: 'var(--font-space-grotesk)' }}
      >
        <span style={{ color: 'var(--fg-muted)' }}>{count}건</span>
        <span style={{ color: barColor }}>
          {type === 'reward' ? '+' : '-'}
          {totalScore}점
        </span>
      </div>
    </div>
  )
}

function buildCategoryStats(entries: DormMileageHistoryItem[]) {
  const statMap = new Map<string, CategoryStat>()

  for (const entry of entries) {
    const key = `${entry.ruleCategory}-${entry.type}`
    const existing = statMap.get(key)

    if (existing) {
      existing.count += 1
      existing.totalScore += entry.score
      continue
    }

    statMap.set(key, {
      category: entry.ruleCategory,
      type: entry.type,
      count: 1,
      totalScore: entry.score,
    })
  }

  return [...statMap.values()].sort(
    (left, right) =>
      right.count - left.count ||
      right.totalScore - left.totalScore ||
      left.category.localeCompare(right.category),
  )
}

function StudentDetailPanel({
  studentId,
  startDate,
  endDate,
}: {
  studentId: string
  startDate: string
  endDate: string
}) {
  const [entries, setEntries] = useState<DormMileageHistoryItem[]>([])
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const loadDetail = useCallback(async () => {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setIsLoading(true)
    setError(null)
    setMounted(false)

    try {
      const allItems: DormMileageHistoryItem[] = []
      let totalPages = 1

      for (
        let currentPage = 1;
        currentPage <= totalPages && !ctrl.signal.aborted;
        currentPage += 1
      ) {
        const params = new URLSearchParams({
          studentId,
          page: `${currentPage}`,
          pageSize: `${DETAIL_FETCH_PAGE_SIZE}`,
        })

        if (startDate) {
          params.set('startDate', startDate)
        }

        if (endDate) {
          params.set('endDate', endDate)
        }

        const response = await fetch(
          `/api/teacher/dorm-mileage/entries?${params.toString()}`,
          {
            signal: ctrl.signal,
            cache: 'no-store',
          },
        )
        const result = await response.json().catch(() => null)

        if (abortRef.current !== ctrl || ctrl.signal.aborted) {
          return
        }

        if (!response.ok) {
          setError(result?.message ?? '데이터를 불러오지 못했습니다.')
          return
        }

        const pageItems: DormMileageHistoryItem[] = Array.isArray(result?.items)
          ? result.items
          : []
        allItems.push(...pageItems)

        const totalCount =
          typeof result?.totalCount === 'number' && result.totalCount >= 0
            ? result.totalCount
            : allItems.length
        totalPages = Math.max(1, Math.ceil(totalCount / DETAIL_FETCH_PAGE_SIZE))
      }

      if (ctrl.signal.aborted) {
        return
      }

      setEntries(allItems.slice(0, 5))
      setCategoryStats(buildCategoryStats(allItems))
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        setError('상세 정보를 불러오는 중 문제가 발생했습니다.')
      }
    } finally {
      if (abortRef.current === ctrl) {
        abortRef.current = null
        setIsLoading(false)
      }
    }
  }, [endDate, startDate, studentId])

  useEffect(() => {
    void loadDetail()

    return () => {
      abortRef.current?.abort()
    }
  }, [loadDetail])

  useEffect(() => {
    if (!isLoading && entries.length > 0) {
      const frame = requestAnimationFrame(() => {
        requestAnimationFrame(() => setMounted(true))
      })

      return () => cancelAnimationFrame(frame)
    }

    setMounted(false)
  }, [entries.length, isLoading])

  const maxCount = useMemo(
    () => Math.max(...categoryStats.map((item) => item.count), 1),
    [categoryStats],
  )
  const hasContent = entries.length > 0 || categoryStats.length > 0

  if (isLoading && !hasContent) {
    return (
      <div
        className="px-6 py-5"
        style={{ backgroundColor: 'var(--bg-muted)' }}
      >
        <ListSkeleton count={3} rowHeight="h-10" />
      </div>
    )
  }

  if (!hasContent) {
    return (
      <div
        className="px-6 py-5"
        style={{ backgroundColor: 'var(--bg-muted)' }}
      >
        <EmptyStatePane
          icon={<SearchIcon size={18} style={{ color: 'var(--fg-muted)' }} />}
          title={error ?? '조회된 내역이 없습니다'}
          description={
            error
              ? '잠시 후 다시 시도해 주세요.'
              : '이 학생에게 아직 기숙사 상벌점 내역이 없습니다.'
          }
          className="min-h-[220px]"
        />
      </div>
    )
  }

  return (
    <div
      className="px-6 py-5"
      style={{ backgroundColor: 'var(--bg-muted)' }}
    >
      <RefetchWrapper isFetching={isLoading && hasContent} isInitialLoad={false}>
        {error && (
          <p
            className="mb-3 text-xs"
            style={{
              fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              color: 'var(--penalty)',
            }}
          >
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {categoryStats.length > 0 && (
            <div>
              <p
                className="mb-2 text-[11px] font-semibold uppercase tracking-wider"
                style={{
                  fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                  color: 'var(--fg-muted)',
                }}
              >
                카테고리별 분포
              </p>
              <div className="space-y-0.5">
                {categoryStats.map((item) => (
                  <CategoryBar
                    key={`${item.category}-${item.type}`}
                    label={item.category}
                    count={item.count}
                    totalScore={item.totalScore}
                    maxCount={maxCount}
                    type={item.type}
                    mounted={mounted}
                  />
                ))}
              </div>
            </div>
          )}

          <div>
            <p
              className="mb-2 text-[11px] font-semibold uppercase tracking-wider"
              style={{
                fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                color: 'var(--fg-muted)',
              }}
            >
              최근 내역 (최대 5건)
            </p>
            <div className="space-y-1.5">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 rounded-lg border px-3 py-2"
                  style={{
                    borderColor: 'var(--border)',
                    backgroundColor: 'var(--bg-subtle)',
                  }}
                >
                  <span
                    className="flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold"
                    style={{
                      fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                      backgroundColor:
                        entry.type === 'reward'
                          ? 'rgba(22,163,74,0.1)'
                          : 'rgba(220,38,38,0.1)',
                      color: entry.type === 'reward' ? '#16a34a' : '#dc2626',
                    }}
                  >
                    {entry.type === 'reward' ? '상점' : '벌점'}
                  </span>
                  <span
                    className="min-w-0 flex-1 truncate text-[11px]"
                    style={{
                      fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                      color: 'var(--fg)',
                    }}
                  >
                    {entry.ruleName}
                  </span>
                  <span
                    className="flex-shrink-0 text-[11px] font-semibold"
                    style={{
                      fontFamily: 'var(--font-space-grotesk)',
                      color: entry.type === 'reward' ? '#16a34a' : '#dc2626',
                    }}
                  >
                    {formatSignedScore(entry.type, entry.score)}
                  </span>
                  <span
                    className="flex-shrink-0 text-[10px]"
                    style={{
                      fontFamily: 'var(--font-space-grotesk)',
                      color: 'var(--fg-muted)',
                    }}
                  >
                    {formatAwardedAt(entry.awardedAt)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </RefetchWrapper>
    </div>
  )
}

export default function DormStudentReportTable({
  students,
  startDate,
  endDate,
}: {
  students: DormStudentMileageSummary[]
  startDate: string
  endDate: string
}) {
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null)

  const toggleExpand = useCallback((studentId: string) => {
    setExpandedStudentId((prev) => (prev === studentId ? null : studentId))
  }, [])

  return (
    <table className="w-full text-xs">
      <thead>
        <tr
          style={{
            borderBottom: '1px solid var(--admin-border)',
            backgroundColor: 'var(--admin-bg)',
          }}
        >
          {['', '학년', '반', '번호', '이름', '상점', '벌점', '순점수'].map(
            (header) => (
              <th
                key={header || 'expand'}
                scope="col"
                className="px-3 py-3 text-left font-semibold"
                style={{
                  fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                  color: 'var(--admin-text-muted)',
                  width: header === '' ? '32px' : undefined,
                }}
              >
                {header}
              </th>
            ),
          )}
        </tr>
      </thead>
      <tbody>
        {students.map((student) => {
          const isExpanded = expandedStudentId === student.studentId

          return (
            <StudentRow
              key={student.studentId}
              student={student}
              isExpanded={isExpanded}
              onToggle={() => toggleExpand(student.studentId)}
              startDate={startDate}
              endDate={endDate}
            />
          )
        })}
      </tbody>
    </table>
  )
}

function StudentRow({
  student,
  isExpanded,
  onToggle,
  startDate,
  endDate,
}: {
  student: DormStudentMileageSummary
  isExpanded: boolean
  onToggle: () => void
  startDate: string
  endDate: string
}) {
  const prefersReducedMotion = useMotionPreference()
  const transition = getMicroInteractionTransition(prefersReducedMotion)

  return (
    <>
      <tr
        onClick={onToggle}
        className="print-expand-trigger"
        style={{
          borderBottom: '1px solid var(--admin-border)',
          cursor: 'pointer',
          backgroundColor: isExpanded ? 'var(--bg-muted)' : 'transparent',
          transition: 'background-color 0.15s ease',
        }}
        onMouseEnter={(event) => {
          if (!isExpanded) {
            event.currentTarget.style.backgroundColor = 'var(--bg-muted)'
          }
        }}
        onMouseLeave={(event) => {
          if (!isExpanded) {
            event.currentTarget.style.backgroundColor = 'transparent'
          }
        }}
      >
        <td className="px-3 py-2.5" style={{ width: '32px' }}>
          <motion.span
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={transition}
            style={{
              display: 'inline-flex',
              color: 'var(--fg-muted)',
            }}
            className="no-print"
          >
            <ChevronDown size={14} />
          </motion.span>
        </td>
        <td
          className="px-3 py-2.5"
          style={{
            fontFamily: 'var(--font-space-grotesk)',
            color: 'var(--admin-text-muted)',
          }}
        >
          {student.grade ?? '\u2014'}
        </td>
        <td
          className="px-3 py-2.5"
          style={{
            fontFamily: 'var(--font-space-grotesk)',
            color: 'var(--admin-text-muted)',
          }}
        >
          {student.classNumber}
        </td>
        <td
          className="px-3 py-2.5"
          style={{
            fontFamily: 'var(--font-space-grotesk)',
            color: 'var(--admin-text-muted)',
          }}
        >
          {student.studentNumber}
        </td>
        <td
          className="px-3 py-2.5 font-medium"
          style={{
            fontFamily: 'var(--font-noto-sans-kr), sans-serif',
            color: 'var(--admin-text)',
          }}
        >
          {student.name}
        </td>
        <td
          className="px-3 py-2.5 font-semibold"
          style={{
            fontFamily: 'var(--font-space-grotesk)',
            color: '#16a34a',
          }}
        >
          +{student.rewardTotal}
        </td>
        <td
          className="px-3 py-2.5 font-semibold"
          style={{
            fontFamily: 'var(--font-space-grotesk)',
            color: '#dc2626',
          }}
        >
          -{student.penaltyTotal}
        </td>
        <td
          className="px-3 py-2.5 font-bold"
          style={{
            fontFamily: 'var(--font-space-grotesk)',
            color: student.netScore >= 0 ? '#16a34a' : '#dc2626',
          }}
        >
          {student.netScore >= 0 ? '+' : ''}
          {student.netScore}
        </td>
      </tr>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.tr
            key={`detail-${student.studentId}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={transition}
            className="print-expanded-row"
          >
            <td colSpan={8} style={{ padding: 0 }}>
              <StudentDetailPanel
                studentId={student.studentId}
                startDate={startDate}
                endDate={endDate}
              />
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  )
}
