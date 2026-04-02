'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Card,
  NoticeBox,
  RuleSelectionModal,
  SCHOOL_OPTIONS,
  getSchoolLabel,
  inputStyle,
  koreanIncludes,
} from './teacher-shared'
import { ModalBase } from '../ui/modal'
import { AnimatedListItem, ListSkeleton } from '../ui/list'
import type {
  CreateSchoolMileageEntriesPayload,
  SchoolMileageRuleSummary,
  SchoolMileageStudentOption,
} from './school-mileage-types'

type GrantRow = {
  localId: number
  student: SchoolMileageStudentOption
  ruleId: number | ''
  score: number | ''
  reason: string
}

type StudentModalProps = {
  isOpen: boolean
  addedStudentIds: Set<string>
  onClose: () => void
  onConfirm: (students: SchoolMileageStudentOption[]) => void
}


function XIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}


// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────

export default function SchoolMileageGrant({
  rules,
  isRulesLoading,
  rulesError,
}: {
  rules: SchoolMileageRuleSummary[]
  isRulesLoading: boolean
  rulesError: string | null
}) {
  const [rows, setRows] = useState<GrantRow[]>([])
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false)
  const [ruleModalRowId, setRuleModalRowId] = useState<number | null>(null)
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const nextRowIdRef = useRef(1)

  const rulesById = useMemo(() => new Map(rules.map((r) => [r.id, r])), [rules])
  const rewardRules = useMemo(() => rules.filter((r) => r.type === 'reward'), [rules])
  const penaltyRules = useMemo(() => rules.filter((r) => r.type === 'penalty'), [rules])
  const addedStudentIds = useMemo(() => new Set(rows.map((r) => r.student.studentId)), [rows])

  const canApplyFirstRow = rows.length >= 2 && rows[0].ruleId !== ''
  const canSubmit =
    rows.length > 0 &&
    !isRulesLoading &&
    rows.every((r) => r.ruleId !== '')

  function handleStudentsAdded(students: SchoolMileageStudentOption[]) {
    setRows((prev) => {
      const existing = new Set(prev.map((r) => r.student.studentId))
      const next = students.filter((s) => !existing.has(s.studentId))
      return [
        ...prev,
        ...next.map<GrantRow>((s) => ({
          localId: nextRowIdRef.current++,
          student: s,
          ruleId: '',
          score: '',
          reason: '',
        })),
      ]
    })
    setNotice(null)
    setIsStudentModalOpen(false)
  }

  function updateRow(localId: number, patch: Partial<GrantRow>) {
    setRows((prev) =>
      prev.map((row) => {
        if (row.localId !== localId) return row
        const next = { ...row, ...patch }
        if (patch.ruleId !== undefined) {
          if (patch.ruleId === '') {
            next.score = ''
          } else {
            const rule = rulesById.get(patch.ruleId)
            next.score = rule?.defaultScore ?? next.score
          }
        }
        return next
      }),
    )
  }

  function removeRow(localId: number) {
    setRows((prev) => prev.filter((r) => r.localId !== localId))
  }

  function applyFirstRowToAll() {
    const first = rows[0]
    if (!first || !canApplyFirstRow) return
    setRows((prev) =>
      prev.map((row, i) =>
        i === 0 ? row : { ...row, ruleId: first.ruleId, score: first.score, reason: first.reason },
      ),
    )
  }

  async function submitEntries() {
    if (!canSubmit) return
    setIsSubmitting(true)
    setNotice(null)

    const payload: CreateSchoolMileageEntriesPayload = {
      entries: rows.map((r) => ({
        studentId: r.student.studentId,
        ruleId: Number(r.ruleId),
        score: Number(r.score),
        ...(r.reason.trim() ? { reason: r.reason.trim() } : {}),
      })),
    }

    try {
      const res = await fetch('/api/teacher/school-mileage/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await res.json().catch(() => null)

      if (!res.ok) {
        setNotice({ type: 'error', message: result?.message ?? '상벌점 부여에 실패했습니다.' })
        return
      }

      setRows([])
      setNotice({ type: 'success', message: result?.message ?? '상벌점이 부여되었습니다.' })
    } catch {
      setNotice({ type: 'error', message: '상벌점 부여 요청 중 문제가 발생했습니다.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // 현재 규칙 모달 대상 행
  const ruleModalCurrentRuleId =
    ruleModalRowId !== null
      ? (rows.find((r) => r.localId === ruleModalRowId)?.ruleId ?? '')
      : ''

  return (
    <>
      <StudentSelectionModal
        isOpen={isStudentModalOpen}
        addedStudentIds={addedStudentIds}
        onClose={() => setIsStudentModalOpen(false)}
        onConfirm={handleStudentsAdded}
      />

      <RuleSelectionModal
        isOpen={ruleModalRowId !== null}
        rewardRules={rewardRules}
        penaltyRules={penaltyRules}
        currentRuleId={ruleModalCurrentRuleId}
        onSelect={(rule) => {
          if (ruleModalRowId !== null) updateRow(ruleModalRowId, { ruleId: rule.id })
        }}
        onClose={() => setRuleModalRowId(null)}
      />

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-end gap-2">
          {rows.length >= 2 && (
            <button
              type="button"
              onClick={applyFirstRowToAll}
              disabled={!canApplyFirstRow || isSubmitting}
              className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
              style={{
                fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                color: 'var(--admin-accent)',
                borderColor: 'var(--admin-accent)',
                backgroundColor: 'var(--admin-accent-bg)',
              }}
            >
              첫 행 설정 모두 적용
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsStudentModalOpen(true)}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            style={{
              fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              backgroundColor: 'var(--admin-accent)',
              boxShadow: '0 2px 8px rgba(67,56,202,0.18)',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
            학생 추가
          </button>
        </div>

        {notice && (
          <NoticeBox
            type={notice.type}
            message={notice.message}
            onDismiss={() => setNotice(null)}
          />
        )}
        {rulesError && <NoticeBox type="error" message={rulesError} />}

        <Card>
          {isRulesLoading ? (
            <ListSkeleton count={3} rowHeight="h-14" />
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ backgroundColor: 'var(--admin-accent-bg)' }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--admin-accent)' }} aria-hidden="true">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="19" y1="8" x2="19" y2="14" />
                  <line x1="22" y1="11" x2="16" y2="11" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text)' }}>
                  선택된 학생이 없습니다
                </p>
                <p className="mt-1 text-xs leading-relaxed" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text-muted)' }}>
                  상단 버튼으로 학생을 추가한 뒤<br />규칙과 점수를 입력하세요.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* 데스크탑 컬럼 헤더 */}
              <div className="hidden items-center gap-3 px-3 pb-3 text-[11px] font-medium sm:flex" style={{ color: 'var(--admin-text-muted)' }}>
                <span style={{ width: 160 }}>학생</span>
                <span style={{ flex: 1 }}>상벌점 항목</span>
                <span style={{ flex: 1.1 }}>사유</span>
                <span style={{ width: 32 }} />
              </div>

              <div className="space-y-2">
                {rows.map((row, index) => {
                  const selectedRule = row.ruleId === '' ? null : rulesById.get(row.ruleId) ?? null
                  // 좌측 컬러 테두리
                  const leftBorderColor =
                    selectedRule === null
                      ? 'var(--admin-border)'
                      : selectedRule.type === 'reward'
                        ? '#16a34a'
                        : '#dc2626'

                  const ruleTrigger = (
                    <button
                      type="button"
                      onClick={() => setRuleModalRowId(row.localId)}
                      className="flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors"
                      style={{
                        ...inputStyle,
                        textAlign: 'left',
                        minHeight: 38,
                        backgroundColor: 'var(--admin-bg)',
                        borderColor: 'var(--admin-border)',
                      }}
                    >
                      {selectedRule ? (
                        <>
                          <span
                            className="flex-shrink-0 rounded-md px-2 py-0.5 text-xs font-bold"
                            style={{
                              backgroundColor: selectedRule.type === 'reward'
                                ? 'rgba(34,197,94,0.15)'
                                : 'rgba(239,68,68,0.15)',
                              color: selectedRule.type === 'reward' ? '#15803d' : '#b91c1c',
                              border: `1px solid ${selectedRule.type === 'reward' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                              fontFamily: 'var(--font-space-grotesk)',
                              lineHeight: '1.4',
                            }}
                          >
                            {selectedRule.type === 'reward' ? '+' : '-'}{selectedRule.defaultScore}점
                          </span>
                          <span
                            className="min-w-0 flex-1 truncate"
                            style={{ color: 'var(--admin-text)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
                          >
                            {selectedRule.name}
                          </span>
                          <span
                            className="flex-shrink-0 text-[11px]"
                            style={{ color: 'var(--admin-text-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
                          >
                            {selectedRule.category}
                          </span>
                        </>
                      ) : (
                        <span style={{ color: 'var(--admin-text-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
                          항목 선택
                        </span>
                      )}
                    </button>
                  )

                  return (
                    <AnimatedListItem
                      key={row.localId}
                      index={index}
                      className="rounded-xl border px-3 py-3"
                      style={{
                        borderColor: 'var(--admin-border)',
                        borderLeft: `3px solid ${leftBorderColor}`,
                        backgroundColor: 'var(--admin-bg)',
                        transition: 'border-left-color 0.2s ease',
                      }}
                    >
                      {/* ── 모바일 레이아웃 ── */}
                      <div className="sm:hidden">
                        <div className="mb-2.5 flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-baseline gap-1.5">
                              <span
                                className="text-sm font-semibold"
                                style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text)' }}
                              >
                                {row.student.name}
                              </span>
                              <span
                                className="text-[11px]"
                                style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text-muted)' }}
                              >
                                {row.student.grade ? `${row.student.grade}학년 ` : ''}{row.student.classNumber}반 {row.student.studentNumber}번
                              </span>
                            </div>
                            <p
                              className="mt-0.5 text-[11px]"
                              style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text-muted)' }}
                            >
                              {getSchoolLabel(row.student.school)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeRow(row.localId)}
                            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-colors hover:opacity-70"
                            style={{ color: '#dc2626' }}
                            aria-label="행 삭제"
                          >
                            <XIcon />
                          </button>
                        </div>
                        <div className="mb-2">{ruleTrigger}</div>
                        <input
                          type="text"
                          value={row.reason}
                          onChange={(e) => updateRow(row.localId, { reason: e.target.value })}
                          className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                          style={inputStyle}
                          placeholder="사유 입력 (선택)"
                        />
                      </div>

                      {/* ── 데스크탑 레이아웃 ── */}
                      <div className="hidden items-center gap-3 sm:flex">
                        {/* 학생 정보 */}
                        <div className="w-[160px] flex-shrink-0 overflow-hidden">
                          <div className="flex min-w-0 items-baseline gap-1">
                            <span
                              className="truncate text-sm font-semibold"
                              style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text)', flexShrink: 0, maxWidth: '55%' }}
                            >
                              {row.student.name}
                            </span>
                            <span
                              className="truncate text-[11px]"
                              style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text-muted)' }}
                            >
                              {row.student.grade ? `${row.student.grade}학년 ` : ''}{row.student.classNumber}반 {row.student.studentNumber}번
                            </span>
                          </div>
                          <p
                            className="truncate mt-0.5 text-[11px]"
                            style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text-muted)' }}
                          >
                            {getSchoolLabel(row.student.school)}
                          </p>
                        </div>

                        {/* 항목 선택 */}
                        <div className="min-w-0 flex-1 overflow-hidden">{ruleTrigger}</div>

                        {/* 사유 */}
                        <div className="flex-[1.1]">
                          <input
                            type="text"
                            value={row.reason}
                            onChange={(e) => updateRow(row.localId, { reason: e.target.value })}
                            className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                            style={inputStyle}
                            placeholder="사유 입력 (선택)"
                          />
                        </div>

                        {/* 삭제 */}
                        <button
                          type="button"
                          onClick={() => removeRow(row.localId)}
                          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors hover:opacity-70"
                          style={{ color: '#dc2626' }}
                          aria-label="행 삭제"
                        >
                          <XIcon />
                        </button>
                      </div>
                    </AnimatedListItem>
                  )
                })}
              </div>

              <button
                type="button"
                onClick={submitEntries}
                disabled={!canSubmit || isSubmitting}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                  backgroundColor: 'var(--admin-accent)',
                  boxShadow: '0 2px 12px rgba(67,56,202,0.2)',
                }}
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin"
                      width="14" height="14" viewBox="0 0 24 24"
                      fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                      aria-hidden="true"
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    부여 중...
                  </>
                ) : (
                  `전체 부여하기 (${rows.length}명)`
                )}
              </button>
            </>
          )}
        </Card>
      </div>
    </>
  )
}

// ─── 학생 선택 모달 ───────────────────────────────────────────────────────────

function StudentSelectionModal({ isOpen, addedStudentIds, onClose, onConfirm }: StudentModalProps) {
  const [school, setSchool] = useState('')
  const [grade, setGrade] = useState('')
  const [classNumber, setClassNumber] = useState('')
  const [name, setName] = useState('')
  const [students, setStudents] = useState<SchoolMileageStudentOption[]>([])
  const [selectedStudents, setSelectedStudents] = useState<Map<string, SchoolMileageStudentOption>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const visibleStudents = useMemo(() => {
    const q = name.trim()
    if (!q) return students
    return students.filter((s) => koreanIncludes(s.name, q))
  }, [name, students])

  useEffect(() => {
    const id = window.setTimeout(() => {
      void (async () => {
        setIsLoading(true)
        setError(null)
        const params = new URLSearchParams()
        if (school) params.set('school', school)
        if (grade) params.set('year', grade)
        if (classNumber) params.set('classNumber', classNumber)

        try {
          const res = await fetch(`/api/teacher/school-mileage/students?${params}`, { cache: 'no-store' })
          const result = await res.json().catch(() => null)
          if (!res.ok) { setError(result?.message ?? '학생 목록을 불러오지 못했습니다.'); setStudents([]); return }
          setStudents(Array.isArray(result?.students) ? result.students : [])
        } catch {
          setError('학생 목록을 불러오는 중 문제가 발생했습니다.')
          setStudents([])
        } finally {
          setIsLoading(false)
        }
      })()
    }, 200)
    return () => window.clearTimeout(id)
  }, [school, grade, classNumber])

  function toggleStudent(student: SchoolMileageStudentOption) {
    if (addedStudentIds.has(student.studentId)) return
    setSelectedStudents((prev) => {
      const next = new Map(prev)
      if (next.has(student.studentId)) next.delete(student.studentId)
      else next.set(student.studentId, student)
      return next
    })
  }

  const selectableStudents = visibleStudents.filter((s) => !addedStudentIds.has(s.studentId))
  const allSelected = selectableStudents.length > 0 && selectableStudents.every((s) => selectedStudents.has(s.studentId))

  function toggleAll() {
    setSelectedStudents((prev) => {
      const next = new Map(prev)
      if (allSelected) selectableStudents.forEach((s) => next.delete(s.studentId))
      else selectableStudents.forEach((s) => next.set(s.studentId, s))
      return next
    })
  }

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} maxWidth="max-w-3xl">
      <div
        className="flex max-h-[90vh] flex-col overflow-hidden rounded-2xl border"
        style={{ backgroundColor: 'var(--admin-sidebar-bg)', borderColor: 'var(--admin-border)' }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--admin-border)' }}>
          <div>
            <p className="text-sm font-semibold" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text)' }}>
              대상 학생 추가
            </p>
            <p className="mt-0.5 text-xs" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text-muted)' }}>
              학교와 학년 조건으로 학생을 찾아 추가하세요.
            </p>
          </div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:opacity-70" style={{ color: 'var(--admin-text-muted)' }} aria-label="닫기">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* 필터 */}
        <div className="grid grid-cols-2 gap-2 px-5 py-4 md:grid-cols-[1fr_100px_100px_1fr]" style={{ borderBottom: '1px solid var(--admin-border)' }}>
          <select value={school} onChange={(e) => setSchool(e.target.value)} className="rounded-lg border px-3 py-2 text-sm outline-none" style={inputStyle}>
            <option value="">전체 학교</option>
            {SCHOOL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={grade} onChange={(e) => setGrade(e.target.value)} className="rounded-lg border px-3 py-2 text-sm outline-none" style={inputStyle}>
            <option value="">전체 학년</option>
            <option value="1">1학년</option>
            <option value="2">2학년</option>
            <option value="3">3학년</option>
          </select>
          <input value={classNumber} onChange={(e) => setClassNumber(e.target.value)} className="rounded-lg border px-3 py-2 text-sm outline-none" style={inputStyle} placeholder="반" inputMode="numeric" />
          <input value={name} onChange={(e) => setName(e.target.value)} className="rounded-lg border px-3 py-2 text-sm outline-none col-span-2 md:col-span-1" style={inputStyle} placeholder="학생 이름 검색" />
        </div>

        {/* 전체 선택 툴바 */}
        <div className="flex items-center justify-between px-5 py-2.5" style={{ borderBottom: '1px solid var(--admin-border)' }}>
          <button
            type="button"
            onClick={toggleAll}
            className="rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors"
            style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', borderColor: 'var(--admin-border)', color: 'var(--admin-text-muted)' }}
          >
            {allSelected ? '전체 선택 해제' : '전체 선택'}
          </button>
          <span className="text-xs" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text-muted)' }}>
            {selectedStudents.size > 0
              ? <span style={{ color: 'var(--admin-accent)', fontWeight: 600 }}>{selectedStudents.size}명</span>
              : '0명'
            }{' '}선택됨
          </span>
        </div>

        {/* 목록 */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {error && <NoticeBox type="error" message={error} />}
          {isLoading ? (
            <ListSkeleton count={5} rowHeight="h-14" />
          ) : visibleStudents.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--admin-text-muted)' }} aria-hidden="true">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <p className="text-sm" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text-muted)' }}>
                조건에 맞는 학생이 없습니다.
              </p>
            </div>
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
                      borderColor: isSelected ? 'var(--admin-accent)' : 'var(--admin-border)',
                      backgroundColor: isSelected ? 'var(--admin-accent-bg)' : 'transparent',
                      opacity: isAdded ? 0.45 : 1,
                    }}
                  >
                    <input type="checkbox" checked={isAdded || isSelected} disabled={isAdded} onChange={() => toggleStudent(student)} style={{ accentColor: 'var(--admin-accent)', width: 15, height: 15 }} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-1.5">
                        <p className="text-sm font-semibold" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text)' }}>
                          {student.name}
                        </p>
                        <span className="text-[11px]" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text-muted)' }}>
                          {student.grade ? `${student.grade}학년 ` : ''}{student.classNumber}반 {student.studentNumber}번
                        </span>
                        {isAdded && (
                          <span className="text-[11px] font-normal" style={{ color: 'var(--admin-text-muted)' }}>이미 추가됨</span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text-muted)' }}>
                        {getSchoolLabel(student.school)}
                      </p>
                    </div>
                    <span className="text-[11px]" style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--admin-text-muted)' }}>
                      {student.studentId}
                    </span>
                  </label>
                )
              })}
            </div>
          )}
        </div>

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
            onClick={() => onConfirm(Array.from(selectedStudents.values()))}
            disabled={selectedStudents.size === 0}
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', backgroundColor: 'var(--admin-accent)' }}
          >
            추가하기 ({selectedStudents.size}명)
          </button>
        </div>
      </div>
    </ModalBase>
  )
}
