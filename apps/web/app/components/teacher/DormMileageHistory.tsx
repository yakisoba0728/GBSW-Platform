'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Card,
  NoticeBox,
} from '../mileage/shared'
import { useDormRulesContext } from '../dorm-mileage/dorm-rules-context'
import { ConfirmModal } from '../ui/modal'
import SuccessModal from '../ui/success-modal'
import { EmptyStatePane } from '../ui/list'
import type {
  PaginatedDormMileageHistoryResponse,
  DormMileageHistoryItem,
} from './dorm-mileage-types'
import type { SchoolMileageHistoryItem } from './school-mileage-types'
import DormEditEntryModal from './DormEditEntryModal'
import HistoryFilters from './DormHistoryFilters'
import HistoryMobileList from './HistoryMobileList'
import HistoryTable from './HistoryTable'
import { SearchIcon } from '../ui/icons'
import {
  getPositiveQueryNumber,
  getQueryString,
  useUpdateSearchParams,
} from '@/lib/url-state'

const INITIAL_RESPONSE: PaginatedDormMileageHistoryResponse = {
  items: [],
  page: 1,
  pageSize: 20,
  totalCount: 0,
}

export default function DormMileageHistory({
  rulesError,
}: {
  rulesError: string | null
}) {
  const { isDormTeacher } = useDormRulesContext()
  const searchParams = useSearchParams()
  const updateSearchParams = useUpdateSearchParams()
  const filters = useMemo(
    () => ({
      type: getQueryString(searchParams, 'type'),
      year: getQueryString(searchParams, 'year'),
      startDate: getQueryString(searchParams, 'startDate'),
      endDate: getQueryString(searchParams, 'endDate'),
      studentName: getQueryString(searchParams, 'studentName'),
    }),
    [searchParams],
  )
  const page = getPositiveQueryNumber(searchParams, 'page', 1)
  const pageSize = getPositiveQueryNumber(searchParams, 'pageSize', 20)
  const [response, setResponse] = useState<PaginatedDormMileageHistoryResponse>(INITIAL_RESPONSE)
  const [isLoading, setIsLoading] = useState(true)
  const [entriesError, setEntriesError] = useState<string | null>(null)
  const [showEntriesErrorModal, setShowEntriesErrorModal] = useState(false)
  const [feedbackModal, setFeedbackModal] = useState<{
    open: boolean; type: 'success' | 'error'; title: string; description: string
  }>({ open: false, type: 'success', title: '', description: '' })
  const [editingItem, setEditingItem] = useState<DormMileageHistoryItem | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<DormMileageHistoryItem | null>(null)
  const fetchAbortControllerRef = useRef<AbortController | null>(null)
  const hasLoadedOnceRef = useRef(false)
  const [isFetching, setIsFetching] = useState(false)

  const pageCount = Math.max(1, Math.ceil(response.totalCount / response.pageSize))
  const hasActiveFilters = Object.values(filters).some((value) => value.length > 0)

  // HistoryMobileList / HistoryTable expect SchoolMileageHistoryItem (which
  // includes `school`). Dorm entries are GBSW-only, so we inject the field.
  const itemsCompat = useMemo(
    () =>
      response.items.map((item) => ({
        ...item,
        school: 'GBSW' as const,
      })) as SchoolMileageHistoryItem[],
    [response.items],
  )

  const loadEntries = useCallback(async () => {
    fetchAbortControllerRef.current?.abort()
    const abortController = new AbortController()
    fetchAbortControllerRef.current = abortController
    setIsFetching(true)
    if (!hasLoadedOnceRef.current) setIsLoading(true)
    setEntriesError(null)
    setShowEntriesErrorModal(false)

    const params = new URLSearchParams()
    params.set('page', `${page}`)
    params.set('pageSize', `${pageSize}`)
    if (filters.type) params.set('type', filters.type)
    if (filters.year) params.set('year', filters.year)
    if (filters.startDate) params.set('startDate', filters.startDate)
    if (filters.endDate) params.set('endDate', filters.endDate)
    if (filters.studentName.trim()) params.set('studentName', filters.studentName.trim())

    try {
      const fetchResponse = await fetch(`/api/teacher/dorm-mileage/entries?${params.toString()}`, {
        cache: 'no-store',
        signal: abortController.signal,
      })
      const result = await fetchResponse.json().catch(() => null)

      if (fetchAbortControllerRef.current !== abortController) return

      if (!fetchResponse.ok) {
        setEntriesError(result?.message ?? '기숙사 상벌점 내역을 불러오지 못했습니다.')
        setShowEntriesErrorModal(true)
        setResponse((prev) => ({ ...prev, items: [], totalCount: 0, page }))
        return
      }

      setResponse({
        items: Array.isArray(result?.items) ? (result.items as DormMileageHistoryItem[]) : [],
        page: typeof result?.page === 'number' && result.page > 0 ? result.page : page,
        pageSize: typeof result?.pageSize === 'number' && result.pageSize > 0 ? result.pageSize : pageSize,
        totalCount: typeof result?.totalCount === 'number' && result.totalCount >= 0 ? result.totalCount : 0,
      })
    } catch {
      if (abortController.signal.aborted) return
      setEntriesError('기숙사 상벌점 내역 조회 중 문제가 발생했습니다.')
      setShowEntriesErrorModal(true)
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

  function updateFilter<
    K extends keyof typeof filters,
  >(key: K, value: (typeof filters)[K]) {
    updateSearchParams({ [key]: value, page: 1 } as Record<string, string | number | null>)
  }

  function resetFilters() {
    updateSearchParams({
      type: null,
      year: null,
      startDate: null,
      endDate: null,
      studentName: null,
      page: null,
    })
  }

  function requestDeleteEntry(item: DormMileageHistoryItem) {
    setConfirmDelete(item)
  }

  async function executeDelete(item: DormMileageHistoryItem) {
    setConfirmDelete(null)
    try {
      const fetchResponse = await fetch(`/api/teacher/dorm-mileage/entries/${item.id}`, { method: 'DELETE' })
      const result = await fetchResponse.json().catch(() => null)

      if (!fetchResponse.ok) {
        setFeedbackModal({ open: true, type: 'error', title: '삭제 실패', description: result?.message ?? '기숙사 상벌점 내역을 삭제하지 못했습니다.' })
        return
      }

      setFeedbackModal({ open: true, type: 'success', title: '삭제 완료', description: result?.message ?? '기숙사 상벌점 내역이 삭제되었습니다.' })

      if (response.items.length === 1 && page > 1) {
        updateSearchParams({ page: page - 1, pageSize })
      } else {
        void loadEntries()
      }
    } catch {
      setFeedbackModal({ open: true, type: 'error', title: '삭제 실패', description: '기숙사 상벌점 내역 삭제 중 문제가 발생했습니다.' })
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
      <DormEditEntryModal
        isOpen={editingItem !== null}
        item={editingItem}
        onClose={() => setEditingItem(null)}
        onSaved={async (message) => {
          setEditingItem(null)
          setFeedbackModal({ open: true, type: 'success', title: '수정 완료', description: message })
          await loadEntries()
        }}
      />

      <div className="flex flex-col h-full gap-3">
        <SuccessModal
          open={showEntriesErrorModal && !!entriesError}
          onClose={() => setShowEntriesErrorModal(false)}
          type="error"
          title="조회 실패"
          description={entriesError ?? ''}
        />
        <SuccessModal
          open={feedbackModal.open}
          onClose={() => setFeedbackModal((prev) => ({ ...prev, open: false }))}
          type={feedbackModal.type}
          title={feedbackModal.title}
          description={feedbackModal.description}
        />
        {rulesError && <NoticeBox type="error" message={rulesError} />}
        {entriesError && <NoticeBox type="error" message={entriesError} />}

        <HistoryFilters
          filters={filters}
          hasActiveFilters={hasActiveFilters}
          onChange={updateFilter}
          onReset={resetFilters}
        />

        {/* -- 데이터 카드 -- */}
        <Card className="pb-3 flex flex-col flex-1 min-h-0 overflow-hidden">
          {entriesError && !isLoading ? (
            <EmptyStatePane
              className="h-full"
              icon={<SearchIcon size={20} style={{ color: 'var(--accent)' }} />}
              title="내역을 불러오지 못했습니다"
              description={entriesError}
            />
          ) : (
            <>
              <HistoryMobileList
                items={itemsCompat}
                isLoading={isLoading}
                isFetching={isFetching}
                onEdit={isDormTeacher === true ? (item) => setEditingItem(item as unknown as DormMileageHistoryItem) : undefined}
                onDelete={isDormTeacher === true ? (item) => requestDeleteEntry(item as unknown as DormMileageHistoryItem) : undefined}
              />

              <HistoryTable
                items={itemsCompat}
                isLoading={isLoading}
                isFetching={isFetching}
                page={page}
                pageCount={pageCount}
                totalCount={response.totalCount}
                onEdit={isDormTeacher === true ? (item) => setEditingItem(item as unknown as DormMileageHistoryItem) : undefined}
                onDelete={isDormTeacher === true ? (item) => requestDeleteEntry(item as unknown as DormMileageHistoryItem) : undefined}
                onPageChange={(nextPage) =>
                  updateSearchParams({ page: nextPage, pageSize })
                }
              />
            </>
          )}
        </Card>
      </div>
    </>
  )
}
