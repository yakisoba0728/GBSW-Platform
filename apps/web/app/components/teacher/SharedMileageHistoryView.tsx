'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, NoticeBox } from '../mileage/shared'
import { EmptyStatePane } from '../ui/list'
import { ConfirmModal } from '../ui/modal'
import SuccessModal from '../ui/success-modal'
import { SearchIcon } from '../ui/icons'
import HistoryMobileList from './HistoryMobileList'
import HistoryTable from './HistoryTable'
import type {
  SharedMileageHistoryItem,
  SharedPaginatedMileageHistoryResponse,
} from './shared-mileage-types'
import {
  getPositiveQueryNumber,
  getQueryString,
  useUpdateSearchParams,
} from '@/lib/url-state'

type SharedMileageHistoryFilters = {
  school?: string
  type: string
  year: string
  startDate: string
  endDate: string
  studentName: string
}

type SharedMileageHistoryViewProps<
  Item extends SharedMileageHistoryItem,
  Response extends SharedPaginatedMileageHistoryResponse<Item>,
> = {
  rulesError: string | null
  initialResponse: Response
  entriesPath: string
  includeSchoolFilter?: boolean
  canManageEntries?: boolean
  loadErrorMessage: string
  loadCatchMessage: string
  deleteErrorMessage: string
  deleteCatchMessage: string
  deleteSuccessMessage: string
  deleteConfirmMessage: (item: Item) => string
  renderEditModal: (props: {
    item: Item | null
    onClose: () => void
    onSaved: (message: string) => Promise<void>
  }) => React.ReactNode
  renderFilters: (props: {
    filters: SharedMileageHistoryFilters
    hasActiveFilters: boolean
    onChange: <K extends keyof SharedMileageHistoryFilters>(
      key: K,
      value: SharedMileageHistoryFilters[K],
    ) => void
    onReset: () => void
  }) => React.ReactNode
}

export default function SharedMileageHistoryView<
  Item extends SharedMileageHistoryItem,
  Response extends SharedPaginatedMileageHistoryResponse<Item>,
>({
  rulesError,
  initialResponse,
  entriesPath,
  includeSchoolFilter = false,
  canManageEntries = true,
  loadErrorMessage,
  loadCatchMessage,
  deleteErrorMessage,
  deleteCatchMessage,
  deleteSuccessMessage,
  deleteConfirmMessage,
  renderEditModal,
  renderFilters,
}: SharedMileageHistoryViewProps<Item, Response>) {
  const searchParams = useSearchParams()
  const updateSearchParams = useUpdateSearchParams()
  const filters = useMemo(
    () => ({
      ...(includeSchoolFilter
        ? { school: getQueryString(searchParams, 'school') }
        : {}),
      type: getQueryString(searchParams, 'type'),
      year: getQueryString(searchParams, 'year'),
      startDate: getQueryString(searchParams, 'startDate'),
      endDate: getQueryString(searchParams, 'endDate'),
      studentName: getQueryString(searchParams, 'studentName'),
    }),
    [includeSchoolFilter, searchParams],
  ) as SharedMileageHistoryFilters

  const page = getPositiveQueryNumber(searchParams, 'page', 1)
  const pageSize = getPositiveQueryNumber(searchParams, 'pageSize', 20)
  const [response, setResponse] = useState<Response>(initialResponse)
  const [isLoading, setIsLoading] = useState(true)
  const [entriesError, setEntriesError] = useState<string | null>(null)
  const [showEntriesErrorModal, setShowEntriesErrorModal] = useState(false)
  const [feedbackModal, setFeedbackModal] = useState<{
    open: boolean
    type: 'success' | 'error'
    title: string
    description: string
  }>({ open: false, type: 'success', title: '', description: '' })
  const [editingItem, setEditingItem] = useState<Item | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Item | null>(null)
  const fetchAbortControllerRef = useRef<AbortController | null>(null)
  const hasLoadedOnceRef = useRef(false)
  const [isFetching, setIsFetching] = useState(false)
  const [hasAnimated, setHasAnimated] = useState(false)

  const pageCount = Math.max(
    1,
    Math.ceil(response.totalCount / response.pageSize),
  )
  const hasActiveFilters = Object.values(filters).some(
    (value) => value.length > 0,
  )

  const loadEntries = useCallback(async () => {
    fetchAbortControllerRef.current?.abort()
    const abortController = new AbortController()
    fetchAbortControllerRef.current = abortController
    setIsFetching(true)
    if (!hasLoadedOnceRef.current) {
      setIsLoading(true)
    }
    setEntriesError(null)
    setShowEntriesErrorModal(false)

    const params = new URLSearchParams()
    params.set('page', `${page}`)
    params.set('pageSize', `${pageSize}`)
    if (includeSchoolFilter && filters.school) {
      params.set('school', filters.school)
    }
    if (filters.type) params.set('type', filters.type)
    if (filters.year) params.set('year', filters.year)
    if (filters.startDate) params.set('startDate', filters.startDate)
    if (filters.endDate) params.set('endDate', filters.endDate)
    if (filters.studentName.trim()) {
      params.set('studentName', filters.studentName.trim())
    }

    try {
      const fetchResponse = await fetch(
        `${entriesPath}?${params.toString()}`,
        {
          cache: 'no-store',
          signal: abortController.signal,
        },
      )
      const result = await fetchResponse.json().catch(() => null)

      if (fetchAbortControllerRef.current !== abortController) {
        return
      }

      if (!fetchResponse.ok) {
        setEntriesError(result?.message ?? loadErrorMessage)
        setShowEntriesErrorModal(true)
        setResponse(
          (previousResponse) =>
            ({
              ...previousResponse,
              items: [],
              totalCount: 0,
              page,
            }) as Response,
        )
        return
      }

      setResponse({
        items: Array.isArray(result?.items) ? (result.items as Item[]) : [],
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
      } as Response)
    } catch {
      if (abortController.signal.aborted) {
        return
      }

      setEntriesError(loadCatchMessage)
      setShowEntriesErrorModal(true)
      setResponse(
        (previousResponse) =>
          ({
            ...previousResponse,
            items: [],
            totalCount: 0,
            page,
          }) as Response,
      )
    } finally {
      if (fetchAbortControllerRef.current === abortController) {
        hasLoadedOnceRef.current = true
        setIsLoading(false)
        setIsFetching(false)
        fetchAbortControllerRef.current = null
        setHasAnimated(true)
      }
    }
  }, [
    entriesPath,
    filters,
    includeSchoolFilter,
    loadCatchMessage,
    loadErrorMessage,
    page,
    pageSize,
  ])

  useEffect(() => {
    void loadEntries()

    return () => {
      fetchAbortControllerRef.current?.abort()
    }
  }, [loadEntries])

  function updateFilter<K extends keyof SharedMileageHistoryFilters>(
    key: K,
    value: SharedMileageHistoryFilters[K],
  ) {
    updateSearchParams({
      [key]: value,
      page: 1,
    } as Record<string, string | number | null>)
  }

  function resetFilters() {
    updateSearchParams({
      ...(includeSchoolFilter ? { school: null } : {}),
      type: null,
      year: null,
      startDate: null,
      endDate: null,
      studentName: null,
      page: null,
    })
  }

  function requestDeleteEntry(item: Item) {
    setConfirmDelete(item)
  }

  async function executeDelete(item: Item) {
    setConfirmDelete(null)

    try {
      const fetchResponse = await fetch(`${entriesPath}/${item.id}`, {
        method: 'DELETE',
      })
      const result = await fetchResponse.json().catch(() => null)

      if (!fetchResponse.ok) {
        setFeedbackModal({
          open: true,
          type: 'error',
          title: '삭제 실패',
          description: result?.message ?? deleteErrorMessage,
        })
        return
      }

      setFeedbackModal({
        open: true,
        type: 'success',
        title: '삭제 완료',
        description: result?.message ?? deleteSuccessMessage,
      })

      if (response.items.length === 1 && page > 1) {
        updateSearchParams({ page: page - 1, pageSize })
      } else {
        await loadEntries()
      }
    } catch {
      setFeedbackModal({
        open: true,
        type: 'error',
        title: '삭제 실패',
        description: deleteCatchMessage,
      })
    }
  }

  return (
    <>
      <ConfirmModal
        isOpen={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            void executeDelete(confirmDelete)
          }
        }}
        title="내역 삭제"
        message={confirmDelete ? deleteConfirmMessage(confirmDelete) : ''}
        confirmLabel="삭제"
        cancelLabel="취소"
        variant="danger"
      />

      {renderEditModal({
        item: editingItem,
        onClose: () => setEditingItem(null),
        onSaved: async (message) => {
          setEditingItem(null)
          setFeedbackModal({
            open: true,
            type: 'success',
            title: '수정 완료',
            description: message,
          })
          await loadEntries()
        },
      })}

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
          onClose={() =>
            setFeedbackModal((previousModal) => ({
              ...previousModal,
              open: false,
            }))
          }
          type={feedbackModal.type}
          title={feedbackModal.title}
          description={feedbackModal.description}
        />
        {rulesError && <NoticeBox type="error" message={rulesError} />}
        {entriesError && <NoticeBox type="error" message={entriesError} />}

        {renderFilters({
          filters,
          hasActiveFilters,
          onChange: updateFilter,
          onReset: resetFilters,
        })}

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
                items={response.items}
                isLoading={isLoading}
                isFetching={isFetching}
                animated={!hasAnimated}
                onEdit={canManageEntries ? setEditingItem : undefined}
                onDelete={canManageEntries ? requestDeleteEntry : undefined}
              />

              <HistoryTable
                items={response.items}
                isLoading={isLoading}
                isFetching={isFetching}
                animated={!hasAnimated}
                page={page}
                pageCount={pageCount}
                totalCount={response.totalCount}
                onEdit={canManageEntries ? setEditingItem : undefined}
                onDelete={canManageEntries ? requestDeleteEntry : undefined}
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
