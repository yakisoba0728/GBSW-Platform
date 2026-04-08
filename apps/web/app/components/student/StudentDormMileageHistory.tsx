'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Filter } from 'lucide-react'
import {
  Card,
  NoticeBox,
  inputStyle,
  formatAwardedAtParts,
  formatAwardedAt,
} from '@/app/components/mileage/shared'
import SuccessModal from '@/app/components/ui/success-modal'
import {
  AnimatedTableRow,
  AnimatedListItem,
  EmptyStatePane,
  ListSkeleton,
  TableRowSkeleton,
} from '@/app/components/ui/list'
import {
  MileageBadge,
  Pagination,
  RefetchWrapper,
} from '@/app/components/ui/primitives'
import { Button } from '@/app/components/ui/button'
import { SearchIcon } from '@/app/components/ui/icons'
import Tooltip from '@/app/components/ui/tooltip'
import type {
  PaginatedStudentDormMileageHistoryResponse,
  StudentDormMileageHistoryItem,
} from './student-dorm-mileage-types'
import {
  getPositiveQueryNumber,
  getQueryString,
  useUpdateSearchParams,
} from '@/lib/url-state'

/* ── 필터 스타일 ── */

function activeInputStyle(active: boolean) {
  return active
    ? { ...inputStyle, borderColor: 'var(--accent)' }
    : inputStyle
}

/* ── 초기값 ── */

const INITIAL_RESPONSE: PaginatedStudentDormMileageHistoryResponse = {
  items: [],
  page: 1,
  pageSize: 20,
  totalCount: 0,
}

/* ── 컴포넌트 ── */

export default function StudentDormMileageHistory() {
  const searchParams = useSearchParams()
  const updateSearchParams = useUpdateSearchParams()

  const filters = useMemo(
    () => ({
      type: getQueryString(searchParams, 'type'),
      startDate: getQueryString(searchParams, 'startDate'),
      endDate: getQueryString(searchParams, 'endDate'),
    }),
    [searchParams],
  )

  const page = getPositiveQueryNumber(searchParams, 'page', 1)
  const pageSize = getPositiveQueryNumber(searchParams, 'pageSize', 20)

  const [response, setResponse] =
    useState<PaginatedStudentDormMileageHistoryResponse>(INITIAL_RESPONSE)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showLoadErrorModal, setShowLoadErrorModal] = useState(false)

  const fetchAbortControllerRef = useRef<AbortController | null>(null)
  const hasLoadedOnceRef = useRef(false)
  const [isFetching, setIsFetching] = useState(false)

  const pageCount = Math.max(
    1,
    Math.ceil(response.totalCount / response.pageSize),
  )
  const hasActiveFilters = Object.values(filters).some(
    (value) => value.length > 0,
  )

  /* ── 데이터 로드 ── */

  const loadEntries = useCallback(async () => {
    fetchAbortControllerRef.current?.abort()
    const abortController = new AbortController()
    fetchAbortControllerRef.current = abortController
    setIsFetching(true)
    if (!hasLoadedOnceRef.current) setIsLoading(true)
    setLoadError(null)
    setShowLoadErrorModal(false)

    const params = new URLSearchParams()
    params.set('page', `${page}`)
    params.set('pageSize', `${pageSize}`)
    if (filters.type) params.set('type', filters.type)
    if (filters.startDate) params.set('startDate', filters.startDate)
    if (filters.endDate) params.set('endDate', filters.endDate)

    try {
      const fetchResponse = await fetch(
        `/api/student/dorm-mileage/entries?${params.toString()}`,
        { cache: 'no-store', signal: abortController.signal },
      )
      const result = await fetchResponse.json().catch(() => null)

      if (fetchAbortControllerRef.current !== abortController) return

      if (!fetchResponse.ok) {
        setLoadError(result?.message ?? '기숙사 상벌점 내역을 불러오지 못했습니다.')
        setShowLoadErrorModal(true)
        setResponse((prev) => ({ ...prev, items: [], totalCount: 0, page }))
        return
      }

      setResponse({
        items: Array.isArray(result?.items)
          ? (result.items as StudentDormMileageHistoryItem[])
          : [],
        page:
          typeof result?.page === 'number' && result.page > 0
            ? result.page
            : page,
        pageSize:
          typeof result?.pageSize === 'number' && result.pageSize > 0
            ? result.pageSize
            : pageSize,
        totalCount:
          typeof result?.totalCount === 'number' && result.totalCount >= 0
            ? result.totalCount
            : 0,
      })
    } catch {
      if (abortController.signal.aborted) return
      setLoadError('기숙사 상벌점 내역 조회 중 문제가 발생했습니다.')
      setShowLoadErrorModal(true)
      setResponse((prev) => ({ ...prev, items: [], totalCount: 0, page }))
    } finally {
      if (fetchAbortControllerRef.current === abortController) {
        hasLoadedOnceRef.current = true
        setIsLoading(false)
        setIsFetching(false)
        fetchAbortControllerRef.current = null
      }
    }
  }, [filters, page, pageSize])

  useEffect(() => {
    void loadEntries()
    return () => {
      fetchAbortControllerRef.current?.abort()
    }
  }, [loadEntries])

  /* ── 필터 핸들러 ── */

  function updateFilter<K extends keyof typeof filters>(
    key: K,
    value: (typeof filters)[K],
  ) {
    updateSearchParams({
      [key]: value,
      page: 1,
    } as Record<string, string | number | null>)
  }

  function resetFilters() {
    updateSearchParams({
      type: null,
      startDate: null,
      endDate: null,
      page: null,
    })
  }

  /* ── 렌더 ── */

  return (
    <div className="flex flex-col h-full gap-3">
      <SuccessModal
        open={showLoadErrorModal && !!loadError}
        onClose={() => setShowLoadErrorModal(false)}
        type="error"
        title="조회 실패"
        description={loadError ?? ''}
      />
      {loadError && <NoticeBox type="error" message={loadError} />}

      {/* ── 필터 바 ── */}
      <Card>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-shrink-0 items-center gap-1.5">
            <Filter
              size={12}
              strokeWidth={2}
              style={{ color: 'var(--fg-muted)' }}
              aria-hidden="true"
            />
            <span
              className="text-xs font-semibold"
              style={{
                fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                color: 'var(--fg-muted)',
              }}
            >
              필터
            </span>
          </div>
          <div
            className="h-4 w-px flex-shrink-0"
            style={{ backgroundColor: 'var(--border)' }}
          />

          <select
            value={filters.type}
            onChange={(event) => updateFilter('type', event.target.value)}
            className="h-8 rounded-md border pl-2.5 pr-6 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            style={activeInputStyle(!!filters.type)}
          >
            <option value="">전체 구분</option>
            <option value="reward">상점</option>
            <option value="penalty">벌점</option>
          </select>

          <div
            className="flex h-8 items-center gap-1.5 rounded-md border px-2.5"
            style={activeInputStyle(
              !!(filters.startDate || filters.endDate),
            )}
          >
            <input
              type="date"
              value={filters.startDate}
              onChange={(event) =>
                updateFilter('startDate', event.target.value)
              }
              className="bg-transparent py-1.5 text-xs outline-none"
              style={{
                color: 'var(--fg)',
                fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                minWidth: 0,
                width: '112px',
              }}
            />
            <span
              style={{
                color: 'var(--fg-muted)',
                fontSize: '0.7rem',
                flexShrink: 0,
              }}
            >
              ~
            </span>
            <input
              type="date"
              value={filters.endDate}
              onChange={(event) =>
                updateFilter('endDate', event.target.value)
              }
              className="bg-transparent py-1.5 text-xs outline-none"
              style={{
                color: 'var(--fg)',
                fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                minWidth: 0,
                width: '112px',
              }}
            />
          </div>

          {hasActiveFilters && (
            <Button
              variant="secondary"
              size="sm"
              onClick={resetFilters}
              className="ml-auto"
            >
              초기화
            </Button>
          )}
        </div>
      </Card>

      {/* ── 데이터 카드 ── */}
      <Card className="pb-3 flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* 모바일 리스트 */}
        <div className="relative min-h-0 flex-1 pr-0.5 md:hidden">
          {isLoading ? (
            <ListSkeleton count={6} rowHeight="h-24" />
          ) : loadError ? (
            <EmptyStatePane
              className="h-full"
              icon={
                <SearchIcon
                  size={20}
                  strokeWidth={1.5}
                  style={{ color: 'var(--accent)' }}
                />
              }
              title="내역을 불러오지 못했습니다"
              description={loadError}
            />
          ) : response.items.length === 0 ? (
            <EmptyStatePane
              className="h-full"
              icon={
                <SearchIcon
                  size={20}
                  strokeWidth={1.5}
                  style={{ color: 'var(--accent)' }}
                />
              }
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
              <div className="space-y-2">
                {response.items.map((item, index) => (
                  <AnimatedListItem
                    key={item.id}
                    index={index}
                    className="rounded-lg border px-3.5 py-3"
                    style={{
                      borderColor: 'var(--admin-border)',
                      backgroundColor: 'var(--admin-bg)',
                      borderLeft: `2px solid ${item.type === 'reward' ? 'var(--reward)' : 'var(--penalty)'}`,
                    }}
                  >
                    {/* 점수 + 규정 */}
                    <div className="mb-1.5 flex items-center gap-2">
                      <MileageBadge type={item.type} score={item.score} />
                      <span
                        className="min-w-0 flex-1 truncate text-[12px] font-medium"
                        style={{
                          color: 'var(--admin-text)',
                          fontFamily:
                            'var(--font-noto-sans-kr), sans-serif',
                        }}
                      >
                        {item.ruleName}
                      </span>
                    </div>

                    {/* 카테고리 + 일시 + 교사 */}
                    <p
                      className="text-[11px]"
                      style={{
                        color: 'var(--admin-text-muted)',
                        fontFamily:
                          'var(--font-noto-sans-kr), sans-serif',
                      }}
                    >
                      {item.ruleCategory} ·{' '}
                      {formatAwardedAt(item.awardedAt)}
                      {item.teacherName
                        ? ` · ${item.teacherName}`
                        : ''}
                    </p>

                    {item.reason?.trim() && (
                      <p
                        className="mt-1 text-[11px]"
                        style={{
                          color: 'var(--admin-text-muted)',
                          fontFamily:
                            'var(--font-noto-sans-kr), sans-serif',
                        }}
                      >
                        사유: {item.reason}
                      </p>
                    )}
                  </AnimatedListItem>
                ))}
              </div>
            </RefetchWrapper>
          )}
        </div>

        {/* 데스크탑 테이블 */}
        <div className="relative hidden min-h-0 flex-1 overflow-x-auto md:block">
          {isLoading ? (
            <table
              className="w-full min-w-[600px] table-fixed"
              style={{
                fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              }}
            >
              <colgroup>
                <col style={{ width: 108 }} />
                <col style={{ width: 68 }} />
                <col style={{ width: 190 }} />
                <col style={{ width: 118 }} />
                <col style={{ width: 116 }} />
              </colgroup>

              <thead className="table-header">
                <tr>
                  {['부여 일시', '점수', '규정 항목', '사유', '부여 교사'].map(
                    (h) => (
                      <th key={h} scope="col">{h}</th>
                    ),
                  )}
                </tr>
              </thead>

              <tbody>
                <TableRowSkeleton columns={5} count={8} />
              </tbody>
            </table>
          ) : loadError ? (
            <EmptyStatePane
              className="h-full"
              icon={
                <SearchIcon
                  size={20}
                  style={{ color: 'var(--accent)' }}
                />
              }
              title="내역을 불러오지 못했습니다"
              description={loadError}
            />
          ) : response.items.length === 0 ? (
            <EmptyStatePane
              className="h-full"
              icon={
                <SearchIcon
                  size={20}
                  style={{ color: 'var(--accent)' }}
                />
              }
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
                className="w-full min-w-[600px] table-fixed"
                style={{
                  fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                }}
              >
                <colgroup>
                  <col style={{ width: 108 }} />
                  <col style={{ width: 68 }} />
                  <col style={{ width: 190 }} />
                  <col style={{ width: 118 }} />
                  <col style={{ width: 116 }} />
                </colgroup>

                <thead className="table-header">
                  <tr>
                    {['부여 일시', '점수', '규정 항목', '사유', '부여 교사'].map(
                      (h) => (
                        <th key={h} scope="col">{h}</th>
                      ),
                    )}
                  </tr>
                </thead>

                <tbody>
                  {response.items.map((item, index) => (
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
                          const { date, time } = formatAwardedAtParts(
                            item.awardedAt,
                          )
                          return (
                            <>
                              <p
                                style={{
                                  color: 'var(--fg-muted)',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {date}
                              </p>
                              <p
                                className="mt-0.5"
                                style={{
                                  color: 'var(--fg-muted)',
                                  opacity: 0.6,
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {time}
                              </p>
                            </>
                          )
                        })()}
                      </td>

                      {/* 점수 */}
                      <td
                        className="py-2 pr-3"
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        <MileageBadge
                          type={item.type}
                          score={item.score}
                        />
                      </td>

                      {/* 규정 항목 */}
                      <td className="overflow-hidden py-2 pr-3">
                        <Tooltip
                          content={`${item.ruleName} — ${item.ruleCategory}`}
                        >
                          <div>
                            <p
                              className="truncate text-[13px] font-medium"
                              style={{ color: 'var(--fg)' }}
                            >
                              {item.ruleName}
                            </p>
                            <p
                              className="mt-0.5 truncate text-[11px]"
                              style={{ color: 'var(--fg-muted)' }}
                            >
                              {item.ruleCategory}
                            </p>
                          </div>
                        </Tooltip>
                      </td>

                      {/* 사유 */}
                      <td className="py-2 pr-3 text-[11px]">
                        {item.reason?.trim() ? (
                          <Tooltip content={item.reason.trim()}>
                            <span
                              className="block truncate"
                              style={{ color: 'var(--fg-muted)' }}
                            >
                              {item.reason.trim()}
                            </span>
                          </Tooltip>
                        ) : (
                          <span
                            style={{
                              color: 'var(--fg-muted)',
                              opacity: 0.4,
                            }}
                          >
                            —
                          </span>
                        )}
                      </td>

                      {/* 부여 교사 */}
                      <td className="overflow-hidden py-2 pr-3 text-[11px]">
                        <p
                          className="truncate"
                          style={{ color: 'var(--fg-muted)' }}
                        >
                          {item.teacherName}
                        </p>
                      </td>
                    </AnimatedTableRow>
                  ))}
                </tbody>
              </table>
            </RefetchWrapper>
          )}
        </div>

        {/* 페이지네이션 */}
        {!isLoading && (
          <Pagination
            page={page}
            pageCount={pageCount}
            totalCount={response.totalCount}
            onChange={(nextPage) =>
              updateSearchParams({ page: nextPage, pageSize })
            }
          />
        )}
      </Card>
    </div>
  )
}
