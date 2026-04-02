'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Card,
  NoticeBox,
  SCHOOL_OPTIONS,
  formatAwardedAt,
  formatAwardedAtParts,
  formatSignedScore,
  getSchoolLabel,
  inputStyle,
} from './teacher-shared'
import { ConfirmModal, ModalBase } from '../ui/modal'
import { AnimatedListItem, AnimatedTableRow, ListSkeleton, ListEmptyState, TableRowSkeleton } from '../ui/list'
import type {
  PaginatedSchoolMileageHistoryResponse,
  SchoolMileageHistoryItem,
  SchoolMileageRuleSummary,
  UpdateSchoolMileageEntryPayload,
} from './school-mileage-types'

type HistoryFilters = {
  school: string
  type: string
  year: string
  startDate: string
  endDate: string
  studentName: string
}

const INITIAL_FILTERS: HistoryFilters = {
  school: '',
  type: '',
  year: '',
  startDate: '',
  endDate: '',
  studentName: '',
}

const INITIAL_RESPONSE: PaginatedSchoolMileageHistoryResponse = {
  items: [],
  page: 1,
  pageSize: 20,
  totalCount: 0,
}

function EditIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  )
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" /><path d="M14 11v6" />
      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

function isFiltersActive(f: HistoryFilters) {
  return JSON.stringify(f) !== JSON.stringify(INITIAL_FILTERS)
}

function activeInputStyle(active: boolean) {
  return active
    ? { ...inputStyle, borderColor: 'var(--admin-accent)' }
    : inputStyle
}

export default function SchoolMileageHistory({
  rules,
  isRulesLoading,
  rulesError,
}: {
  rules: SchoolMileageRuleSummary[]
  isRulesLoading: boolean
  rulesError: string | null
}) {
  const [filters, setFilters] = useState(INITIAL_FILTERS)
  const [response, setResponse] = useState<PaginatedSchoolMileageHistoryResponse>(INITIAL_RESPONSE)
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [editingItem, setEditingItem] = useState<SchoolMileageHistoryItem | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<SchoolMileageHistoryItem | null>(null)
  const fetchAbortControllerRef = useRef<AbortController | null>(null)
  const hasLoadedOnceRef = useRef(false)
  const [isFetching, setIsFetching] = useState(false)

  const pageCount = Math.max(1, Math.ceil(response.totalCount / response.pageSize))
  const hasActiveFilters = isFiltersActive(filters)

  const loadEntries = useCallback(async () => {
    fetchAbortControllerRef.current?.abort()
    const abortController = new AbortController()
    fetchAbortControllerRef.current = abortController
    setIsFetching(true)
    if (!hasLoadedOnceRef.current) setIsLoading(true)

    const params = new URLSearchParams()
    params.set('page', `${page}`)
    params.set('pageSize', `${response.pageSize}`)
    if (filters.school) params.set('school', filters.school)
    if (filters.type) params.set('type', filters.type)
    if (filters.year) params.set('year', filters.year)
    if (filters.startDate) params.set('startDate', filters.startDate)
    if (filters.endDate) params.set('endDate', filters.endDate)
    if (filters.studentName.trim()) params.set('studentName', filters.studentName.trim())

    try {
      const fetchResponse = await fetch(`/api/teacher/school-mileage/entries?${params.toString()}`, {
        cache: 'no-store',
        signal: abortController.signal,
      })
      const result = await fetchResponse.json().catch(() => null)

      if (fetchAbortControllerRef.current !== abortController) return

      if (!fetchResponse.ok) {
        setNotice({ type: 'error', message: result?.message ?? '상벌점 내역을 불러오지 못했습니다.' })
        setResponse((prev) => ({ ...prev, items: [], totalCount: 0, page }))
        return
      }

      setResponse({
        items: Array.isArray(result?.items) ? (result.items as SchoolMileageHistoryItem[]) : [],
        page: typeof result?.page === 'number' && result.page > 0 ? result.page : page,
        pageSize: typeof result?.pageSize === 'number' && result.pageSize > 0 ? result.pageSize : response.pageSize,
        totalCount: typeof result?.totalCount === 'number' && result.totalCount >= 0 ? result.totalCount : 0,
      })
    } catch {
      if (abortController.signal.aborted) return
      setNotice({ type: 'error', message: '상벌점 내역 조회 중 문제가 발생했습니다.' })
      setResponse((prev) => ({ ...prev, items: [], totalCount: 0, page }))
    } finally {
      if (fetchAbortControllerRef.current === abortController) {
        hasLoadedOnceRef.current = true
        setIsLoading(false)
        setIsFetching(false)
        fetchAbortControllerRef.current = null
      }
    }
  }, [filters, page, response.pageSize])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => { void loadEntries() }, 200)
    return () => {
      window.clearTimeout(timeoutId)
      fetchAbortControllerRef.current?.abort()
    }
  }, [loadEntries])

  function updateFilter<K extends keyof HistoryFilters>(key: K, value: HistoryFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }

  function resetFilters() {
    setFilters(INITIAL_FILTERS)
    setPage(1)
  }

  function requestDeleteEntry(item: SchoolMileageHistoryItem) {
    setConfirmDelete(item)
  }

  async function executeDelete(item: SchoolMileageHistoryItem) {
    setConfirmDelete(null)
    setNotice(null)
    try {
      const fetchResponse = await fetch(`/api/teacher/school-mileage/entries/${item.id}`, { method: 'DELETE' })
      const result = await fetchResponse.json().catch(() => null)

      if (!fetchResponse.ok) {
        setNotice({ type: 'error', message: result?.message ?? '상벌점 내역을 삭제하지 못했습니다.' })
        return
      }

      setNotice({ type: 'success', message: result?.message ?? '상벌점 내역이 삭제되었습니다.' })

      if (response.items.length === 1 && page > 1) {
        setPage((prev) => prev - 1)
      } else {
        void loadEntries()
      }
    } catch {
      setNotice({ type: 'error', message: '상벌점 내역 삭제 중 문제가 발생했습니다.' })
    }
  }

  return (
    <>
      {/* 삭제 확인 모달 */}
      <ConfirmModal
        isOpen={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => { if (confirmDelete) void executeDelete(confirmDelete) }}
        title="내역 삭제"
        message={
          confirmDelete
            ? `${confirmDelete.studentName} 학생의 "${confirmDelete.ruleName}" 내역을 삭제할까요?\n이 작업은 되돌릴 수 없습니다.`
            : ''
        }
        confirmLabel="삭제"
        cancelLabel="취소"
        variant="danger"
      />

      {/* 편집 모달 */}
      <EditEntryModal
        isOpen={editingItem !== null}
        item={editingItem}
        rules={rules}
        isRulesLoading={isRulesLoading}
        onClose={() => setEditingItem(null)}
        onSaved={async (message) => {
          setEditingItem(null)
          setNotice({ type: 'success', message })
          await loadEntries()
        }}
      />

      <div className="space-y-3">
        {notice && (
          <NoticeBox
            type={notice.type}
            message={notice.message}
            onDismiss={() => setNotice(null)}
          />
        )}
        {rulesError && <NoticeBox type="error" message={rulesError} />}

        {/* ── 필터 카드 ── */}
        <Card>
          <div className="flex flex-wrap items-center gap-2">
            {/* 필터 레이블 */}
            <div className="flex flex-shrink-0 items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ color: 'var(--admin-text-muted)' }}>
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              <span className="text-xs font-semibold" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text-muted)' }}>필터</span>
            </div>
            <div className="h-4 w-px flex-shrink-0" style={{ backgroundColor: 'var(--admin-border)' }} />

            {/* 학교 / 구분 / 학년 */}
            <select
              value={filters.school}
              onChange={(e) => updateFilter('school', e.target.value)}
              className="rounded-lg border py-1.5 pl-2.5 pr-6 text-xs outline-none"
              style={activeInputStyle(!!filters.school)}
            >
              <option value="">전체 학교</option>
              {SCHOOL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            <select
              value={filters.type}
              onChange={(e) => updateFilter('type', e.target.value)}
              className="rounded-lg border py-1.5 pl-2.5 pr-6 text-xs outline-none"
              style={activeInputStyle(!!filters.type)}
            >
              <option value="">전체 구분</option>
              <option value="reward">상점</option>
              <option value="penalty">벌점</option>
            </select>

            <select
              value={filters.year}
              onChange={(e) => updateFilter('year', e.target.value)}
              className="rounded-lg border py-1.5 pl-2.5 pr-6 text-xs outline-none"
              style={activeInputStyle(!!filters.year)}
            >
              <option value="">전체 학년</option>
              <option value="1">1학년</option>
              <option value="2">2학년</option>
              <option value="3">3학년</option>
            </select>

            {/* 날짜 범위 */}
            <div
              className="flex items-center gap-1.5 rounded-lg border px-2.5"
              style={activeInputStyle(!!(filters.startDate || filters.endDate))}
            >
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => updateFilter('startDate', e.target.value)}
                className="bg-transparent py-1.5 text-xs outline-none"
                style={{ color: 'var(--admin-text)', fontFamily: 'var(--font-noto-sans-kr), sans-serif', minWidth: 0, width: '112px' }}
              />
              <span style={{ color: 'var(--admin-text-muted)', fontSize: '0.7rem', flexShrink: 0 }}>~</span>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => updateFilter('endDate', e.target.value)}
                className="bg-transparent py-1.5 text-xs outline-none"
                style={{ color: 'var(--admin-text)', fontFamily: 'var(--font-noto-sans-kr), sans-serif', minWidth: 0, width: '112px' }}
              />
            </div>

            {/* 학생 이름 검색 */}
            <input
              type="text"
              value={filters.studentName}
              onChange={(e) => updateFilter('studentName', e.target.value)}
              placeholder="학생 이름"
              className="rounded-lg border px-2.5 py-1.5 text-xs outline-none"
              style={{ ...activeInputStyle(!!filters.studentName), width: '100px' }}
            />

            {/* 초기화 버튼 */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="ml-auto rounded-md border px-2 py-1 text-[11px] font-medium transition-opacity hover:opacity-70"
                style={{ borderColor: 'var(--admin-accent)', color: 'var(--admin-accent)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
              >
                초기화
              </button>
            )}
          </div>
        </Card>

        {/* ── 데이터 카드 ── */}
        <Card className="pb-3">
          <>
              {/* ── 모바일 카드 리스트 ── */}
              <div
                className="relative overflow-y-auto pr-0.5 md:hidden"
                style={{
                  height: 'calc(100dvh - 290px)',
                  minHeight: '200px',
                }}
              >
                {isFetching && !isLoading && (
                  <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center animate-fade-in">
                    <div
                      className="flex items-center gap-2 rounded-xl border px-3.5 py-2 shadow-lg"
                      style={{ backgroundColor: 'var(--admin-sidebar-bg)', borderColor: 'var(--admin-border)' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="animate-spin flex-shrink-0" style={{ color: 'var(--admin-accent)' }} aria-hidden="true">
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      </svg>
                      <span className="text-xs font-medium" style={{ color: 'var(--admin-text-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>조회 중</span>
                    </div>
                  </div>
                )}
                {isLoading ? (
                  <ListSkeleton count={6} rowHeight="h-24" />
                ) : response.items.length === 0 ? (
                  <div className="flex h-full items-center justify-center" style={{ opacity: isFetching ? 0.35 : 1, transition: 'opacity 200ms' }}>
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
                    {response.items.map((item, index) => (
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
                        {/* 상단: 이름 + 편집/삭제 */}
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
                              onClick={() => setEditingItem(item)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors hover:opacity-70"
                              style={{ borderColor: 'var(--admin-border)', color: 'var(--admin-text-muted)' }}
                              aria-label="편집"
                            >
                              <EditIcon />
                            </button>
                            <button
                              type="button"
                              onClick={() => requestDeleteEntry(item)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors hover:opacity-70"
                              style={{ borderColor: 'rgba(239,68,68,0.3)', color: '#dc2626' }}
                              aria-label="삭제"
                            >
                              <TrashIcon />
                            </button>
                          </div>
                        </div>
                        {/* 점수 + 규칙명 */}
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

              {/* ── 데스크탑 테이블 ── */}
              <div
                className="relative hidden overflow-x-auto overflow-y-auto md:block"
                style={{ height: 'calc(100dvh - 290px)', minHeight: '200px' }}
              >
                {isFetching && !isLoading && (
                  <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center animate-fade-in">
                    <div
                      className="flex items-center gap-2 rounded-xl border px-3.5 py-2 shadow-lg"
                      style={{ backgroundColor: 'var(--admin-sidebar-bg)', borderColor: 'var(--admin-border)' }}
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
                      {['부여 일시', '학생', '점수', '규정 항목', '사유', '부여 교사', ''].map((h) => (
                        <th
                          key={h}
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
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <TableRowSkeleton columns={7} count={6} />
                    ) : response.items.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ height: 'calc(100dvh - 340px)', minHeight: '160px', verticalAlign: 'middle' }}>
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
                    ) : response.items.map((item, index) => (
                      <AnimatedTableRow
                        key={item.id}
                        index={index}
                        className="hover:bg-black/[0.025] dark:hover:bg-white/[0.025] transition-colors"
                        style={{ borderBottom: '1px solid var(--admin-border)' }}
                      >
                        {/* 부여 일시 — 좌측 컬러 테두리 */}
                        <td
                          className="py-3 pr-3 text-xs"
                          style={{
                            borderLeft: `2px solid ${item.type === 'reward' ? '#16a34a' : '#dc2626'}`,
                            paddingLeft: '10px',
                          }}
                        >
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
                        {/* 학생 */}
                        <td className="py-3 pr-3 overflow-hidden">
                          <div className="flex min-w-0 items-baseline gap-1">
                            <p className="truncate text-sm font-semibold" style={{ color: 'var(--admin-text)', flexShrink: 0, maxWidth: '55%' }}>
                              {item.studentName}
                            </p>
                            <p className="truncate text-[11px]" style={{ color: 'var(--admin-text-muted)' }}>
                              {item.grade ? `${item.grade}학년 ` : ''}{item.classNumber}반 {item.studentNumber}번
                            </p>
                          </div>
                          <p className="truncate text-[11px] mt-0.5" style={{ color: 'var(--admin-text-muted)' }}>
                            {getSchoolLabel(item.school)} · {item.studentId}
                          </p>
                        </td>
                        {/* 점수 */}
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
                        {/* 규정 항목 */}
                        <td className="py-3 pr-3 overflow-hidden">
                          <p className="truncate font-medium" style={{ color: 'var(--admin-text)' }}>{item.ruleName}</p>
                          <p className="truncate mt-0.5 text-[11px]" style={{ color: 'var(--admin-text-muted)' }}>{item.ruleCategory}</p>
                        </td>
                        {/* 사유 */}
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
                        {/* 부여 교사 */}
                        <td className="py-3 pr-3 overflow-hidden text-xs">
                          <p className="truncate" style={{ color: 'var(--admin-text-muted)' }}>{item.teacherName}</p>
                          <p className="truncate mt-0.5 text-[11px]" style={{ color: 'var(--admin-text-muted)', opacity: 0.7 }}>{item.teacherId}</p>
                        </td>
                        {/* 액션 */}
                        <td className="py-3">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingItem(item)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors hover:opacity-70"
                              style={{ borderColor: 'var(--admin-border)', color: 'var(--admin-text-muted)' }}
                              aria-label="편집"
                            >
                              <EditIcon />
                            </button>
                            <button
                              type="button"
                              onClick={() => requestDeleteEntry(item)}
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

              {/* ── 페이지네이션 — 로딩 중에는 숨김 ── */}
              {!isLoading && <div className="mt-4 flex items-center justify-between gap-3">
                <p className="text-xs" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text-muted)' }}>
                  총 <span style={{ color: 'var(--admin-text)', fontWeight: 600 }}>{response.totalCount.toLocaleString()}</span>건
                </p>
                <div className="flex items-center gap-1">
                  {/* 이전 버튼 */}
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ borderColor: 'var(--admin-border)', color: 'var(--admin-text-muted)' }}
                    aria-label="이전 페이지"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>

                  {/* 페이지 번호 */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(pageCount, 5) }, (_, i) => {
                      let n: number
                      if (pageCount <= 5) n = i + 1
                      else if (page <= 3) n = i + 1
                      else if (page >= pageCount - 2) n = pageCount - 4 + i
                      else n = page - 2 + i
                      return (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setPage(n)}
                          className="h-8 min-w-[32px] rounded-lg border px-1.5 text-sm font-medium transition-colors"
                          style={
                            n === page
                              ? { backgroundColor: 'var(--admin-accent)', color: '#fff', borderColor: 'var(--admin-accent)', fontFamily: 'var(--font-space-grotesk)' }
                              : { color: 'var(--admin-text-muted)', borderColor: 'var(--admin-border)', fontFamily: 'var(--font-space-grotesk)' }
                          }
                        >
                          {n}
                        </button>
                      )
                    })}
                  </div>

                  {/* 다음 버튼 */}
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
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
              </div>}
          </>
        </Card>
      </div>
    </>
  )
}

// ─── EditEntryModal ───────────────────────────────────────────────────────────

function EditEntryModal({
  isOpen,
  item,
  onClose,
  onSaved,
}: {
  isOpen: boolean
  item: SchoolMileageHistoryItem | null
  rules: SchoolMileageRuleSummary[]
  isRulesLoading: boolean
  onClose: () => void
  onSaved: (message: string) => Promise<void>
}) {
  const [reason, setReason] = useState(item?.reason ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // item이 바뀔 때 reason 동기화
  useEffect(() => {
    if (item) setReason(item.reason ?? '')
    setError(null)
  }, [item])

  async function handleSubmit() {
    if (!item) return
    setIsSubmitting(true)
    setError(null)

    const payload: UpdateSchoolMileageEntryPayload = { reason }

    try {
      const response = await fetch(`/api/teacher/school-mileage/entries/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await response.json().catch(() => null)

      if (!response.ok) { setError(result?.message ?? '상벌점 내역을 수정하지 못했습니다.'); return }
      await onSaved(result?.message ?? '상벌점 내역이 수정되었습니다.')
    } catch {
      setError('상벌점 내역 수정 중 문제가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const readonlyStyle: React.CSSProperties = {
    ...inputStyle,
    color: 'var(--admin-text-muted)',
    cursor: 'default',
    opacity: 0.8,
  }

  // item이 null이면 빈 모달 (ModalBase가 isOpen=false일 때 처리)
  if (!item && !isOpen) return null

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg">
      <div
        className="flex flex-col overflow-hidden rounded-2xl border"
        style={{ backgroundColor: 'var(--admin-sidebar-bg)', borderColor: 'var(--admin-border)' }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--admin-border)' }}>
          <div>
            <p className="text-sm font-semibold" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text)' }}>
              상벌점 내역 편집
            </p>
            {item && (
              <p className="mt-0.5 text-xs" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text-muted)' }}>
                {item.studentName} · {item.grade ? `${item.grade}학년 ` : ''}{item.classNumber}반 {item.studentNumber}번 · {getSchoolLabel(item.school)}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:opacity-70"
            style={{ color: 'var(--admin-text-muted)' }}
            aria-label="닫기"
          >
            <XIcon />
          </button>
        </div>

        {/* 본문 */}
        {item && (
          <div className="px-5 py-5">
            {error && <div className="mb-4"><NoticeBox type="error" message={error} /></div>}

            <div className="space-y-4">
              {/* 상벌점 항목 (읽기 전용) */}
              <div className="space-y-1.5">
                <span className="text-xs font-medium" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text-muted)' }}>
                  상벌점 항목
                </span>
                <div
                  className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                  style={readonlyStyle}
                >
                  <span
                    className="flex-shrink-0 rounded-md px-2 py-0.5 text-xs font-bold"
                    style={{
                      backgroundColor: item.type === 'reward' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                      color: item.type === 'reward' ? '#15803d' : '#b91c1c',
                      border: `1px solid ${item.type === 'reward' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                      fontFamily: 'var(--font-space-grotesk)',
                    }}
                  >
                    {item.type === 'reward' ? '+' : '-'}{item.score}점
                  </span>
                  <span className="min-w-0 flex-1 truncate" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
                    {item.ruleName}
                  </span>
                  <span className="flex-shrink-0 text-[11px]" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
                    {item.ruleCategory}
                  </span>
                </div>
              </div>

              {/* 부여 일시 · 부여 교사 (읽기 전용) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <span className="text-xs font-medium" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text-muted)' }}>부여 일시</span>
                  <p className="rounded-lg border px-3 py-2 text-sm" style={readonlyStyle}>
                    {formatAwardedAt(item.awardedAt)}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <span className="text-xs font-medium" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text-muted)' }}>부여 교사</span>
                  <p className="rounded-lg border px-3 py-2 text-sm" style={readonlyStyle}>
                    {item.teacherName}
                  </p>
                </div>
              </div>

              {/* 사유 (수정 가능) */}
              <label className="space-y-1.5">
                <span className="text-xs font-medium" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text-muted)' }}>사유</span>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                  style={inputStyle}
                  placeholder="사유 입력 (선택)"
                  autoFocus
                />
              </label>
            </div>
          </div>
        )}

        {/* 푸터 */}
        <div className="flex items-center justify-end gap-2 px-5 py-4" style={{ borderTop: '1px solid var(--admin-border)' }}>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
            style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', borderColor: 'var(--admin-border)', color: 'var(--admin-text-muted)' }}
          >
            취소
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting || !item}
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
            style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', backgroundColor: 'var(--admin-accent)' }}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                저장 중...
              </>
            ) : '저장'}
          </button>
        </div>
      </div>
    </ModalBase>
  )
}
