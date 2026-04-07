'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  FieldBlock,
  SCHOOLS,
  formatPhoneNumberInput,
  inputBase,
  inputBaseStyle,
  type School,
} from '@/app/admin/components/account-form-shared'
import { Button } from '@/app/components/ui/button'
import { EditIcon, SearchIcon, UserPlusIcon } from '@/app/components/ui/icons'
import { ListSkeleton } from '@/app/components/ui/list'
import { Modal, ModalFooter } from '@/app/components/ui/modal'
import { NoticeBox } from '@/app/components/ui/notice'

type StudentRecord = {
  studentId: string
  school: School
  currentYear: number
  currentClass: number
  currentNumber: number
  majorSubject: string | null
  name: string
  phone: string
  isActive: boolean
}

type StudentFilters = {
  search: string
  school: '' | School
  isActive: '' | 'true' | 'false'
}

type StudentEditForm = {
  name: string
  phone: string
  school: School
  currentYear: string
  currentClass: string
  currentNumber: string
  majorSubject: string
}

const INITIAL_FILTERS: StudentFilters = {
  search: '',
  school: '',
  isActive: '',
}

export default function AdminStudentList() {
  const [filters, setFilters] = useState<StudentFilters>(INITIAL_FILTERS)
  const [students, setStudents] = useState<StudentRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  const [editingStudent, setEditingStudent] = useState<StudentRecord | null>(null)
  const [editForm, setEditForm] = useState<StudentEditForm | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    void loadStudents(filters)
  }, [filters])

  const activeCount = useMemo(
    () => students.filter((student) => student.isActive).length,
    [students],
  )

  async function loadStudents(nextFilters: StudentFilters) {
    setIsLoading(true)
    setError(null)

    try {
      const searchParams = new URLSearchParams()

      if (nextFilters.search.trim()) {
        searchParams.set('search', nextFilters.search.trim())
      }

      if (nextFilters.school) {
        searchParams.set('school', nextFilters.school)
      }

      if (nextFilters.isActive) {
        searchParams.set('isActive', nextFilters.isActive)
      }

      const query = searchParams.toString()
      const response = await fetch(
        `/api/admin/students${query ? `?${query}` : ''}`,
        { cache: 'no-store' },
      )
      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        setError(payload?.message ?? '학생 목록을 불러오지 못했습니다.')
        return
      }

      setStudents(Array.isArray(payload?.students) ? payload.students : [])
    } catch {
      setError('학생 목록 조회 중 문제가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  function updateFilter<K extends keyof StudentFilters>(
    key: K,
    value: StudentFilters[K],
  ) {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  function openEditModal(student: StudentRecord) {
    setNotice(null)
    setEditingStudent(student)
    setEditForm({
      name: student.name,
      phone: formatPhoneNumberInput(student.phone),
      school: student.school,
      currentYear: String(student.currentYear),
      currentClass: String(student.currentClass),
      currentNumber: String(student.currentNumber),
      majorSubject: student.majorSubject ?? '',
    })
  }

  function closeEditModal() {
    if (isSaving) {
      return
    }

    setEditingStudent(null)
    setEditForm(null)
  }

  function updateEditForm<K extends keyof StudentEditForm>(
    key: K,
    value: StudentEditForm[K],
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
    if (!editingStudent || !editForm) {
      return
    }

    setIsSaving(true)
    setNotice(null)

    try {
      const response = await fetch(
        `/api/admin/students/${encodeURIComponent(editingStudent.studentId)}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: editForm.name,
            phone: editForm.phone,
            school: editForm.school,
            currentYear: editForm.currentYear,
            currentClass: editForm.currentClass,
            currentNumber: editForm.currentNumber,
            majorSubject: editForm.majorSubject,
          }),
        },
      )

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        setNotice({
          type: 'error',
          message: payload?.message ?? '학생 정보를 수정하지 못했습니다.',
        })
        return
      }

      setNotice({
        type: 'success',
        message: payload?.message ?? '학생 정보가 수정되었습니다.',
      })
      closeEditModal()
      await loadStudents(filters)
    } catch {
      setNotice({
        type: 'error',
        message: '학생 정보 수정 중 문제가 발생했습니다.',
      })
    } finally {
      setIsSaving(false)
    }
  }

  async function toggleStudentStatus(student: StudentRecord) {
    setStatusUpdatingId(student.studentId)
    setNotice(null)

    try {
      const response = await fetch(
        `/api/admin/students/${encodeURIComponent(student.studentId)}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            isActive: !student.isActive,
          }),
        },
      )

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        setNotice({
          type: 'error',
          message:
            payload?.message ?? '학생 계정 상태를 변경하지 못했습니다.',
        })
        return
      }

      setNotice({
        type: 'success',
        message:
          payload?.message ??
          (student.isActive
            ? '학생 계정을 비활성화했습니다.'
            : '학생 계정을 활성화했습니다.'),
      })
      await loadStudents(filters)
    } catch {
      setNotice({
        type: 'error',
        message: '학생 계정 상태 변경 중 문제가 발생했습니다.',
      })
    } finally {
      setStatusUpdatingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2
            className="text-base font-semibold"
            style={{
              fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              color: 'var(--fg)',
            }}
          >
            학생 관리
          </h2>
          <p
            className="mt-1 text-xs leading-relaxed"
            style={{
              fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              color: 'var(--fg-muted)',
            }}
          >
            학생 계정을 검색하고, 정보 수정과 활성 상태를 관리할 수 있습니다.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <MetricChip label="전체" value={students.length} />
          <MetricChip label="활성" value={activeCount} accent />
          <Link href="/admin/students/create">
            <Button
              variant="primary"
              size="md"
              icon={<UserPlusIcon size={13} strokeWidth={2.5} />}
            >
              학생 생성
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

      <section
        className="rounded-2xl border p-4"
        style={{
          borderColor: 'var(--border)',
          backgroundColor: 'var(--bg)',
        }}
      >
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.6fr)_160px_160px_auto]">
          <div>
            <label className={filterLabelStyle}>검색</label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--fg-muted)]">
                <SearchIcon />
              </span>
              <input
                value={filters.search}
                onChange={(event) => updateFilter('search', event.target.value)}
                placeholder="아이디, 이름, 전화번호, 전공과목"
                className={`${inputBase} pl-9`}
                style={inputBaseStyle}
              />
            </div>
          </div>

          <div>
            <label className={filterLabelStyle}>학교</label>
            <select
              value={filters.school}
              onChange={(event) =>
                updateFilter('school', event.target.value as StudentFilters['school'])
              }
              className={inputBase}
              style={inputBaseStyle}
            >
              <option value="">전체</option>
              {SCHOOLS.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={filterLabelStyle}>상태</label>
            <select
              value={filters.isActive}
              onChange={(event) =>
                updateFilter(
                  'isActive',
                  event.target.value as StudentFilters['isActive'],
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
              onClick={() => void loadStudents(filters)}
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
      </section>

      <section
        className="overflow-hidden rounded-2xl border"
        style={{
          borderColor: 'var(--border)',
          backgroundColor: 'var(--bg)',
        }}
      >
        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-sm" style={{ borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['아이디', '학교', '현재 학적', '이름', '전공과목', '전화번호', '상태', '작업'].map((label) => (
                  <th
                    key={label}
                    className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-widest"
                    style={{
                      color: 'var(--fg-muted)',
                      fontFamily: 'var(--font-space-grotesk)',
                    }}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-5">
                    <ListSkeleton count={6} rowHeight="h-11" />
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10">
                    <NoticeBox type="error" message={error} />
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-14 text-center text-sm"
                    style={{
                      color: 'var(--fg-muted)',
                      fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                    }}
                  >
                    조건에 맞는 학생 계정이 없습니다.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr
                    key={student.studentId}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      opacity: student.isActive ? 1 : 0.7,
                    }}
                  >
                    <td className="px-4 py-3 text-xs" style={monoCellStyle}>
                      {student.studentId}
                    </td>
                    <td className="px-4 py-3 text-xs" style={monoCellStyle}>
                      {student.school}
                    </td>
                    <td className="px-4 py-3 text-[13px]" style={textCellStyle}>
                      {student.currentYear}학년 {student.currentClass}반 {student.currentNumber}번
                    </td>
                    <td className="px-4 py-3 text-[13px] font-medium" style={textCellStyle}>
                      {student.name}
                    </td>
                    <td className="px-4 py-3 text-[13px]" style={textCellStyle}>
                      {student.majorSubject ?? '-'}
                    </td>
                    <td className="px-4 py-3 text-xs" style={monoCellStyle}>
                      {formatPhoneNumber(student.phone)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge isActive={student.isActive} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={<EditIcon />}
                          onClick={() => openEditModal(student)}
                        >
                          수정
                        </Button>
                        <Button
                          variant={student.isActive ? 'danger' : 'accent'}
                          size="sm"
                          loading={statusUpdatingId === student.studentId}
                          disabled={statusUpdatingId === student.studentId}
                          onClick={() => void toggleStudentStatus(student)}
                        >
                          {student.isActive ? '비활성화' : '활성화'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        open={editingStudent !== null && editForm !== null}
        onClose={closeEditModal}
        title={editingStudent ? `${editingStudent.studentId} 수정` : '학생 정보 수정'}
        size="md"
      >
        {editForm && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FieldBlock label="이름" htmlFor="edit-student-name">
                <input
                  id="edit-student-name"
                  value={editForm.name}
                  onChange={(event) => updateEditForm('name', event.target.value)}
                  className={inputBase}
                  style={inputBaseStyle}
                />
              </FieldBlock>

              <FieldBlock label="전화번호" htmlFor="edit-student-phone">
                <input
                  id="edit-student-phone"
                  value={editForm.phone}
                  onChange={(event) => updateEditForm('phone', event.target.value)}
                  className={inputBase}
                  style={inputBaseStyle}
                />
              </FieldBlock>

              <FieldBlock label="학교" htmlFor="edit-student-school">
                <select
                  id="edit-student-school"
                  value={editForm.school}
                  onChange={(event) =>
                    updateEditForm('school', event.target.value as School)
                  }
                  className={inputBase}
                  style={inputBaseStyle}
                >
                  {SCHOOLS.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.full}
                    </option>
                  ))}
                </select>
              </FieldBlock>

              <FieldBlock label="전공과목" htmlFor="edit-student-major">
                <input
                  id="edit-student-major"
                  value={editForm.majorSubject}
                  onChange={(event) =>
                    updateEditForm('majorSubject', event.target.value)
                  }
                  className={inputBase}
                  style={inputBaseStyle}
                />
              </FieldBlock>

              <FieldBlock label="현재 학년" htmlFor="edit-student-year">
                <input
                  id="edit-student-year"
                  inputMode="numeric"
                  value={editForm.currentYear}
                  onChange={(event) =>
                    updateEditForm('currentYear', numericOnly(event.target.value, 4))
                  }
                  className={inputBase}
                  style={inputBaseStyle}
                />
              </FieldBlock>

              <div className="grid grid-cols-2 gap-4">
                <FieldBlock label="현재 반" htmlFor="edit-student-class">
                  <input
                    id="edit-student-class"
                    inputMode="numeric"
                    value={editForm.currentClass}
                    onChange={(event) =>
                      updateEditForm('currentClass', numericOnly(event.target.value, 2))
                    }
                    className={inputBase}
                    style={inputBaseStyle}
                  />
                </FieldBlock>

                <FieldBlock label="현재 번호" htmlFor="edit-student-number">
                  <input
                    id="edit-student-number"
                    inputMode="numeric"
                    value={editForm.currentNumber}
                    onChange={(event) =>
                      updateEditForm('currentNumber', numericOnly(event.target.value, 2))
                    }
                    className={inputBase}
                    style={inputBaseStyle}
                  />
                </FieldBlock>
              </div>
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

function MetricChip({
  label,
  value,
  accent = false,
}: {
  label: string
  value: number
  accent?: boolean
}) {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs"
      style={{
        borderColor: accent ? 'var(--accent-border)' : 'var(--border)',
        backgroundColor: accent ? 'var(--accent-subtle)' : 'var(--bg)',
        color: accent ? 'var(--accent)' : 'var(--fg-muted)',
        fontFamily: 'var(--font-noto-sans-kr), sans-serif',
      }}
    >
      <span>{label}</span>
      <strong style={{ color: 'var(--fg)' }}>{value}</strong>
    </div>
  )
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{
        fontFamily: 'var(--font-noto-sans-kr), sans-serif',
        backgroundColor: isActive
          ? 'rgba(34,197,94,0.12)'
          : 'rgba(148,163,184,0.18)',
        color: isActive ? '#15803d' : 'var(--fg-muted)',
      }}
    >
      {isActive ? '활성' : '비활성'}
    </span>
  )
}

function numericOnly(value: string, maxLength: number) {
  return value.replaceAll(/\D/g, '').slice(0, maxLength)
}

function formatPhoneNumber(phone: string) {
  return formatPhoneNumberInput(phone)
}

const filterLabelStyle =
  'mb-1.5 block text-xs font-medium text-[var(--fg-muted)]'

const monoCellStyle = {
  color: 'var(--fg-muted)',
  fontFamily: 'var(--font-space-grotesk)',
} satisfies React.CSSProperties

const textCellStyle = {
  color: 'var(--fg)',
  fontFamily: 'var(--font-noto-sans-kr), sans-serif',
} satisfies React.CSSProperties
