'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { FieldBlock, formatPhoneNumberInput, inputBase, inputBaseStyle } from '@/app/admin/components/account-form-shared'
import {
  AccountPageIntro,
  AdminPanel,
  DormBadge,
  MetricChip,
  StatusBadge,
  filterLabelStyle,
  monoCellStyle,
  textCellStyle,
} from '@/app/components/admin/account-ui-shared'
import { Button } from '@/app/components/ui/button'
import { DataTable, type DataTableColumn } from '@/app/components/ui/data-table'
import { EditIcon, SearchIcon, UserPlusCompactIcon } from '@/app/components/ui/icons'
import { ListSkeleton } from '@/app/components/ui/list'
import { Modal, ModalFooter } from '@/app/components/ui/modal'
import { NoticeBox } from '@/app/components/ui/notice'
import { RefetchWrapper } from '@/app/components/ui/primitives'
import { useLoadingGate } from '@/app/components/ui/useLoadingGate'

type TeacherRecord = {
  teacherId: string
  name: string
  phone: string
  isDormTeacher: boolean
  isActive: boolean
}

type TeacherFilters = {
  search: string
  isActive: '' | 'true' | 'false'
}

type TeacherEditForm = {
  name: string
  phone: string
  isDormTeacher: boolean
}

const INITIAL_FILTERS: TeacherFilters = {
  search: '',
  isActive: '',
}

export default function AdminTeacherList() {
  const [filters, setFilters] = useState<TeacherFilters>(INITIAL_FILTERS)
  const [teachers, setTeachers] = useState<TeacherRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  const showLoading = useLoadingGate({ active: isLoading && !hasLoadedOnce })
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  const [editingTeacher, setEditingTeacher] = useState<TeacherRecord | null>(null)
  const [editForm, setEditForm] = useState<TeacherEditForm | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    void loadTeachers(filters)
  }, [filters])

  const dormTeacherCount = useMemo(
    () => teachers.filter((teacher) => teacher.isDormTeacher).length,
    [teachers],
  )

  async function loadTeachers(nextFilters: TeacherFilters) {
    let didLoadSuccessfully = false
    setIsLoading(true)
    setError(null)

    try {
      const searchParams = new URLSearchParams()

      if (nextFilters.search.trim()) {
        searchParams.set('search', nextFilters.search.trim())
      }

      if (nextFilters.isActive) {
        searchParams.set('isActive', nextFilters.isActive)
      }

      const query = searchParams.toString()
      const response = await fetch(
        `/api/admin/teachers${query ? `?${query}` : ''}`,
        { cache: 'no-store' },
      )
      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        setError(payload?.message ?? '교사 목록을 불러오지 못했습니다.')
        return
      }

      setTeachers(Array.isArray(payload?.teachers) ? payload.teachers : [])
      didLoadSuccessfully = true
    } catch {
      setError('교사 목록 조회 중 문제가 발생했습니다.')
    } finally {
      setIsLoading(false)
      if (didLoadSuccessfully) {
        setHasLoadedOnce(true)
      }
    }
  }

  function updateFilter<K extends keyof TeacherFilters>(
    key: K,
    value: TeacherFilters[K],
  ) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  function openEditModal(teacher: TeacherRecord) {
    setNotice(null)
    setEditingTeacher(teacher)
    setEditForm({
      name: teacher.name,
      phone: formatPhoneNumberInput(teacher.phone),
      isDormTeacher: teacher.isDormTeacher,
    })
  }

  function closeEditModal() {
    if (isSaving) {
      return
    }

    setEditingTeacher(null)
    setEditForm(null)
  }

  function updateEditForm<K extends keyof TeacherEditForm>(
    key: K,
    value: TeacherEditForm[K],
  ) {
    setEditForm((prev) => {
      if (!prev) {
        return prev
      }

      return {
        ...prev,
        [key]: key === 'phone' ? formatPhoneNumberInput(String(value)) : value,
      }
    })
  }

  async function submitEdit() {
    if (!editingTeacher || !editForm) {
      return
    }

    setIsSaving(true)
    setNotice(null)

    try {
      const response = await fetch(
        `/api/admin/teachers/${encodeURIComponent(editingTeacher.teacherId)}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: editForm.name,
            phone: editForm.phone,
            isDormTeacher: editForm.isDormTeacher,
          }),
        },
      )

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        setNotice({
          type: 'error',
          message: payload?.message ?? '교사 정보를 수정하지 못했습니다.',
        })
        return
      }

      setNotice({
        type: 'success',
        message: payload?.message ?? '교사 정보가 수정되었습니다.',
      })
      closeEditModal()
      await loadTeachers(filters)
    } catch {
      setNotice({
        type: 'error',
        message: '교사 정보 수정 중 문제가 발생했습니다.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function toggleTeacherStatus(teacher: TeacherRecord) {
    setStatusUpdatingId(teacher.teacherId)
    setNotice(null)

    try {
      const response = await fetch(
        `/api/admin/teachers/${encodeURIComponent(teacher.teacherId)}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            isActive: !teacher.isActive,
          }),
        },
      )

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        setNotice({
          type: 'error',
          message:
            payload?.message ?? '교사 계정 상태를 변경하지 못했습니다.',
        })
        return
      }

      setNotice({
        type: 'success',
        message:
          payload?.message ??
          (teacher.isActive
            ? '교사 계정을 비활성화했습니다.'
            : '교사 계정을 활성화했습니다.'),
      })
      await loadTeachers(filters)
    } catch {
      setNotice({
        type: 'error',
        message: '교사 계정 상태 변경 중 문제가 발생했습니다.',
      })
    } finally {
      setStatusUpdatingId(null)
    }
  }

  const teacherColumns: DataTableColumn<TeacherRecord>[] = useMemo(
    () => [
      {
        key: 'teacherId',
        header: '아이디',
        render: (teacher) => (
          <span className="text-xs" style={monoCellStyle}>
            {teacher.teacherId}
          </span>
        ),
      },
      {
        key: 'name',
        header: '이름',
        render: (teacher) => (
          <span className="text-[13px] font-medium" style={textCellStyle}>
            {teacher.name}
          </span>
        ),
      },
      {
        key: 'phone',
        header: '전화번호',
        render: (teacher) => (
          <span className="text-xs" style={monoCellStyle}>
            {formatPhoneNumberInput(teacher.phone)}
          </span>
        ),
      },
      {
        key: 'isDormTeacher',
        header: '사감 교사',
        render: (teacher) => <DormBadge enabled={teacher.isDormTeacher} />,
      },
      {
        key: 'isActive',
        header: '상태',
        render: (teacher) => <StatusBadge isActive={teacher.isActive} />,
      },
      {
        key: 'actions',
        header: '작업',
        render: (teacher) => (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={<EditIcon />}
              onClick={() => openEditModal(teacher)}
            >
              수정
            </Button>
            <Button
              variant={teacher.isActive ? 'danger' : 'accent'}
              size="sm"
              loading={statusUpdatingId === teacher.teacherId}
              disabled={statusUpdatingId === teacher.teacherId}
              onClick={() => void toggleTeacherStatus(teacher)}
            >
              {teacher.isActive ? '비활성화' : '활성화'}
            </Button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [statusUpdatingId],
  )

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <AccountPageIntro
          title="교사 관리"
          description="교사 계정을 검색하고, 사감 권한과 활성 상태를 함께 관리할 수 있습니다."
        />

        <div className="flex flex-wrap items-center gap-2">
          <MetricChip label="전체" value={teachers.length} />
          <MetricChip label="사감 교사" value={dormTeacherCount} accent />
          <Link href="/admin/teachers/create">
            <Button
              variant="primary"
              size="md"
              icon={<UserPlusCompactIcon />}
            >
              교사 생성
            </Button>
          </Link>
        </div>
      </section>

      {notice && (
        <NoticeBox
          type={notice.type}
          message={notice.message}
          onDismiss={() => setNotice(null)}
        />
      )}

      <AdminPanel>
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.6fr)_180px_auto]">
          <div>
            <label className={filterLabelStyle}>검색</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]">
                <SearchIcon />
              </span>
              <input
                value={filters.search}
                onChange={(event) => updateFilter('search', event.target.value)}
                placeholder="아이디, 이름, 전화번호"
                className={`${inputBase} pl-9`}
                style={inputBaseStyle}
              />
            </div>
          </div>

          <div>
            <label className={filterLabelStyle}>상태</label>
            <select
              value={filters.isActive}
              onChange={(event) =>
                updateFilter(
                  'isActive',
                  event.target.value as TeacherFilters['isActive'],
                )
              }
              className={inputBase}
              style={inputBaseStyle}
            >
              <option value="">전체</option>
              <option value="true">활성</option>
              <option value="false">비활성</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <Button
              variant="secondary"
              size="md"
              onClick={() => void loadTeachers(filters)}
            >
              새로고침
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={() => setFilters(INITIAL_FILTERS)}
            >
              초기화
            </Button>
          </div>
        </div>
      </AdminPanel>

      <AdminPanel padded={false}>
        <div className="overflow-x-auto">
          {showLoading ? (
            <div className="px-4 py-5">
              <ListSkeleton count={5} rowHeight="h-11" />
            </div>
          ) : error ? (
            <div className="px-4 py-10">
              <NoticeBox type="error" message={error} />
            </div>
          ) : (
            <RefetchWrapper
              isFetching={isLoading && hasLoadedOnce}
              isInitialLoad={false}
            >
              <DataTable
                columns={teacherColumns}
                data={teachers}
                rowKey={(t) => t.teacherId}
                emptyTitle="조건에 맞는 교사 계정이 없습니다."
                className="min-w-[860px]"
              />
            </RefetchWrapper>
          )}
        </div>
      </AdminPanel>

      <Modal
        open={editingTeacher !== null && editForm !== null}
        onClose={closeEditModal}
        title={editingTeacher ? `${editingTeacher.teacherId} 수정` : '교사 정보 수정'}
        size="sm"
      >
        {editForm && (
          <>
            <div className="space-y-4">
              <FieldBlock label="이름" htmlFor="edit-teacher-name">
                <input
                  id="edit-teacher-name"
                  value={editForm.name}
                  onChange={(event) => updateEditForm('name', event.target.value)}
                  className={inputBase}
                  style={inputBaseStyle}
                />
              </FieldBlock>

              <FieldBlock label="전화번호" htmlFor="edit-teacher-phone">
                <input
                  id="edit-teacher-phone"
                  value={editForm.phone}
                  onChange={(event) => updateEditForm('phone', event.target.value)}
                  className={inputBase}
                  style={inputBaseStyle}
                />
              </FieldBlock>

              <label
                className="flex items-center justify-between rounded-xl border px-3.5 py-3"
                style={{
                  borderColor: 'var(--border)',
                  backgroundColor: 'var(--bg-subtle)',
                  fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--fg)' }}>
                    사감 교사 권한
                  </p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--fg-muted)' }}>
                    기숙사 상벌점 부여 권한을 함께 관리합니다.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={editForm.isDormTeacher}
                  onChange={(event) =>
                    updateEditForm('isDormTeacher', event.target.checked)
                  }
                  style={{ width: 16, height: 16 }}
                />
              </label>
            </div>

            <ModalFooter>
              <Button variant="ghost" onClick={closeEditModal} disabled={isSaving}>
                취소
              </Button>
              <Button variant="primary" onClick={() => void submitEdit()} loading={isSaving}>
                저장
              </Button>
            </ModalFooter>
          </>
        )}
      </Modal>
    </div>
  )
}
