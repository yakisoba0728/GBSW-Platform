'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '../ui/button'
import { EmptyStatePane, ListSkeleton } from '../ui/list'
import { ModalBase } from '../ui/modal'
import { UsersIcon, XIcon } from '../ui/icons'
import type { SchoolMileageStudentOption } from './school-mileage-types'
import {
  NoticeBox,
  SCHOOL_OPTIONS,
  getSchoolLabel,
  inputStyle,
} from '../mileage/shared'
import { koreanIncludes } from '@/lib/korean-search'

type StudentSelectionModalProps = {
  isOpen: boolean
  addedStudentIds: Set<string>
  onClose: () => void
  onConfirm: (students: SchoolMileageStudentOption[]) => void
}

export default function StudentSelectionModal({
  isOpen,
  addedStudentIds,
  onClose,
  onConfirm,
}: StudentSelectionModalProps) {
  const [school, setSchool] = useState('')
  const [grade, setGrade] = useState('')
  const [classNumber, setClassNumber] = useState('')
  const [name, setName] = useState('')
  const [students, setStudents] = useState<SchoolMileageStudentOption[]>([])
  const [selectedStudents, setSelectedStudents] = useState<
    Map<string, SchoolMileageStudentOption>
  >(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchAbortControllerRef = useRef<AbortController | null>(null)

  const visibleStudents = useMemo(() => {
    const query = name.trim()

    if (!query) {
      return students
    }

    return students.filter((student) => koreanIncludes(student.name, query))
  }, [name, students])

  const selectableStudents = useMemo(
    () =>
      visibleStudents.filter(
        (student) => !addedStudentIds.has(student.studentId),
      ),
    [addedStudentIds, visibleStudents],
  )

  const allSelected =
    selectableStudents.length > 0 &&
    selectableStudents.every((student) =>
      selectedStudents.has(student.studentId),
    )

  function handleClose() {
    setSelectedStudents(new Map())
    onClose()
  }

  useEffect(() => {
    if (!isOpen) return

    const abortController = new AbortController()
    fetchAbortControllerRef.current?.abort()
    fetchAbortControllerRef.current = abortController

    void (async () => {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (school) params.set('school', school)
      if (grade) params.set('year', grade)
      if (classNumber) params.set('classNumber', classNumber)

      try {
        const response = await fetch(
          `/api/teacher/school-mileage/students?${params.toString()}`,
          {
            cache: 'no-store',
            signal: abortController.signal,
          },
        )
        const result = await response.json().catch(() => null)

        if (
          fetchAbortControllerRef.current !== abortController ||
          abortController.signal.aborted
        ) {
          return
        }

        if (!response.ok) {
          setError(result?.message ?? '학생 목록을 불러오지 못했습니다.')
          setStudents([])
          return
        }

        setStudents(Array.isArray(result?.students) ? result.students : [])
      } catch {
        if (abortController.signal.aborted) {
          return
        }
        setError('학생 목록을 불러오는 중 문제가 발생했습니다.')
        setStudents([])
      } finally {
        if (fetchAbortControllerRef.current === abortController) {
          fetchAbortControllerRef.current = null
          setIsLoading(false)
        }
      }
    })()

    return () => {
      abortController.abort()
    }
  }, [classNumber, grade, isOpen, school])

  function toggleStudent(student: SchoolMileageStudentOption) {
    if (addedStudentIds.has(student.studentId)) {
      return
    }

    setSelectedStudents((prev) => {
      const next = new Map(prev)

      if (next.has(student.studentId)) {
        next.delete(student.studentId)
      } else {
        next.set(student.studentId, student)
      }

      return next
    })
  }

  function toggleAll() {
    setSelectedStudents((prev) => {
      const next = new Map(prev)

      if (allSelected) {
        selectableStudents.forEach((student) => {
          next.delete(student.studentId)
        })
      } else {
        selectableStudents.forEach((student) => {
          next.set(student.studentId, student)
        })
      }

      return next
    })
  }

  return (
    <ModalBase isOpen={isOpen} onClose={handleClose} maxWidth="max-w-3xl">
      <div
        className="flex max-h-[90vh] flex-col overflow-hidden rounded-2xl border"
        style={{
          backgroundColor: 'var(--admin-sidebar-bg)',
          borderColor: 'var(--admin-border)',
        }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--admin-border)' }}
        >
          <div>
            <p
              className="text-sm font-semibold"
              style={{
                fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                color: 'var(--admin-text)',
              }}
            >
              대상 학생 추가
            </p>
            <p
              className="mt-0.5 text-xs"
              style={{
                fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                color: 'var(--admin-text-muted)',
              }}
            >
              학교와 학년 조건으로 학생을 찾아 추가하세요.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:opacity-70"
            style={{ color: 'var(--admin-text-muted)' }}
            aria-label="닫기"
          >
            <XIcon />
          </button>
        </div>

        <div
          className="grid grid-cols-2 gap-2 px-5 py-4 md:grid-cols-[1fr_100px_100px_1fr]"
          style={{ borderBottom: '1px solid var(--admin-border)' }}
        >
          <select
            value={school}
            onChange={(event) => setSchool(event.target.value)}
            className="rounded-lg border px-3 py-2 text-sm outline-none"
            style={inputStyle}
          >
            <option value="">전체 학교</option>
            {SCHOOL_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select
            value={grade}
            onChange={(event) => setGrade(event.target.value)}
            className="rounded-lg border px-3 py-2 text-sm outline-none"
            style={inputStyle}
          >
            <option value="">전체 학년</option>
            <option value="1">1학년</option>
            <option value="2">2학년</option>
            <option value="3">3학년</option>
          </select>
          <input
            value={classNumber}
            onChange={(event) => setClassNumber(event.target.value)}
            className="rounded-lg border px-3 py-2 text-sm outline-none"
            style={inputStyle}
            placeholder="반"
            inputMode="numeric"
          />
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="col-span-2 rounded-lg border px-3 py-2 text-sm outline-none md:col-span-1"
            style={inputStyle}
            placeholder="학생 이름 검색"
          />
        </div>

        <div
          className="flex items-center justify-between px-5 py-2.5"
          style={{ borderBottom: '1px solid var(--admin-border)' }}
        >
          <Button variant="secondary" size="sm" onClick={toggleAll}>
            {allSelected ? '전체 선택 해제' : '전체 선택'}
          </Button>
          <span
            className="text-xs"
            style={{
              fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              color: 'var(--admin-text-muted)',
            }}
          >
            {selectedStudents.size > 0 ? (
              <span style={{ color: 'var(--admin-accent)', fontWeight: 600 }}>
                {selectedStudents.size}명
              </span>
            ) : (
              '0명'
            )}{' '}
            선택됨
          </span>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {error && <NoticeBox type="error" message={error} />}
          {isLoading ? (
            <ListSkeleton count={5} rowHeight="h-14" />
          ) : visibleStudents.length === 0 ? (
            <EmptyStatePane
              icon={
                <UsersIcon
                  size={28}
                  strokeWidth={1.5}
                  style={{ color: 'var(--admin-text-muted)' }}
                />
              }
              title="조건에 맞는 학생이 없습니다."
              description="학교와 학년 조건을 바꿔 다시 찾아보세요."
              className="min-h-[220px]"
            />
          ) : (
            <div className="space-y-1.5">
              {visibleStudents.map((student) => {
                const isAdded = addedStudentIds.has(student.studentId)
                const isSelected = selectedStudents.has(student.studentId)

                return (
                  <label
                    key={student.studentId}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition-colors"
                    style={{
                      borderColor: isSelected
                        ? 'var(--admin-accent)'
                        : 'var(--admin-border)',
                      backgroundColor: isSelected
                        ? 'var(--admin-accent-bg)'
                        : 'transparent',
                      opacity: isAdded ? 0.45 : 1,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isAdded || isSelected}
                      disabled={isAdded}
                      onChange={() => toggleStudent(student)}
                      style={{
                        accentColor: 'var(--admin-accent)',
                        width: 15,
                        height: 15,
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-1.5">
                        <p
                          className="text-sm font-semibold"
                          style={{
                            fontFamily:
                              'var(--font-noto-sans-kr), sans-serif',
                            color: 'var(--admin-text)',
                          }}
                        >
                          {student.name}
                        </p>
                        <span
                          className="text-[11px]"
                          style={{
                            fontFamily:
                              'var(--font-noto-sans-kr), sans-serif',
                            color: 'var(--admin-text-muted)',
                          }}
                        >
                          {student.grade ? `${student.grade}학년 ` : ''}
                          {student.classNumber}반 {student.studentNumber}번
                        </span>
                        {isAdded && (
                          <span
                            className="text-[11px] font-normal"
                            style={{ color: 'var(--admin-text-muted)' }}
                          >
                            이미 추가됨
                          </span>
                        )}
                      </div>
                      <p
                        className="mt-0.5 text-xs"
                        style={{
                          fontFamily:
                            'var(--font-noto-sans-kr), sans-serif',
                          color: 'var(--admin-text-muted)',
                        }}
                      >
                        {getSchoolLabel(student.school)}
                      </p>
                    </div>
                    <span
                      className="text-[11px]"
                      style={{
                        fontFamily: 'var(--font-space-grotesk)',
                        color: 'var(--admin-text-muted)',
                      }}
                    >
                      {student.studentId}
                    </span>
                  </label>
                )
              })}
            </div>
          )}
        </div>

        <div
          className="flex items-center justify-end gap-2 px-5 py-4"
          style={{ borderTop: '1px solid var(--admin-border)' }}
        >
          <Button variant="secondary" size="sm" onClick={handleClose}>
            취소
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onConfirm(Array.from(selectedStudents.values()))}
            disabled={selectedStudents.size === 0}
          >
            추가하기 ({selectedStudents.size}명)
          </Button>
        </div>
      </div>
    </ModalBase>
  )
}
