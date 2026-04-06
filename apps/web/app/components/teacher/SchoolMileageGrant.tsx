'use client'

import { useMemo, useRef, useState } from 'react'
import { ListSkeleton } from '../ui/list'
import RuleSelectionModal from './RuleSelectionModal'
import StudentSelectionModal from './StudentSelectionModal'
import GrantRowCard, { type GrantRow } from './GrantRowCard'
import { Card, NoticeBox } from './teacher-shared'
import type {
  CreateSchoolMileageEntriesPayload,
  SchoolMileageRuleSummary,
  SchoolMileageStudentOption,
} from './school-mileage-types'

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
  const [notice, setNotice] = useState<{
    type: 'success' | 'error'
    message: string
  } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const nextRowIdRef = useRef(1)

  const rulesById = useMemo(
    () => new Map(rules.map((rule) => [rule.id, rule])),
    [rules],
  )
  const rewardRules = useMemo(
    () => rules.filter((rule) => rule.type === 'reward'),
    [rules],
  )
  const penaltyRules = useMemo(
    () => rules.filter((rule) => rule.type === 'penalty'),
    [rules],
  )
  const addedStudentIds = useMemo(
    () => new Set(rows.map((row) => row.student.studentId)),
    [rows],
  )

  const canApplyFirstRow = rows.length >= 2 && rows[0]?.ruleId !== ''
  const canSubmit =
    rows.length > 0 && !isRulesLoading && rows.every((row) => row.ruleId !== '')

  function handleStudentsAdded(students: SchoolMileageStudentOption[]) {
    setRows((prev) => {
      const existing = new Set(prev.map((row) => row.student.studentId))
      const nextStudents = students.filter(
        (student) => !existing.has(student.studentId),
      )

      return [
        ...prev,
        ...nextStudents.map<GrantRow>((student) => ({
          localId: nextRowIdRef.current++,
          student,
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
        if (row.localId !== localId) {
          return row
        }

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
    setRows((prev) => prev.filter((row) => row.localId !== localId))
  }

  function applyFirstRowToAll() {
    const firstRow = rows[0]

    if (!firstRow || !canApplyFirstRow) {
      return
    }

    setRows((prev) =>
      prev.map((row, index) =>
        index === 0
          ? row
          : {
              ...row,
              ruleId: firstRow.ruleId,
              score: firstRow.score,
              reason: firstRow.reason,
            },
      ),
    )
  }

  async function submitEntries() {
    if (!canSubmit) {
      return
    }

    setIsSubmitting(true)
    setNotice(null)

    const payload: CreateSchoolMileageEntriesPayload = {
      entries: rows.map((row) => ({
        studentId: row.student.studentId,
        ruleId: Number(row.ruleId),
        score: Number(row.score),
        ...(row.reason.trim() ? { reason: row.reason.trim() } : {}),
      })),
    }

    try {
      const response = await fetch('/api/teacher/school-mileage/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await response.json().catch(() => null)

      if (!response.ok) {
        setNotice({
          type: 'error',
          message: result?.message ?? '상벌점 부여에 실패했습니다.',
        })
        return
      }

      setRows([])
      setNotice({
        type: 'success',
        message: result?.message ?? '상벌점이 부여되었습니다.',
      })
    } catch {
      setNotice({
        type: 'error',
        message: '상벌점 부여 요청 중 문제가 발생했습니다.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const currentRuleId =
    ruleModalRowId !== null
      ? (rows.find((row) => row.localId === ruleModalRowId)?.ruleId ?? '')
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
        currentRuleId={currentRuleId}
        onSelect={(rule) => {
          if (ruleModalRowId !== null) {
            updateRow(ruleModalRowId, { ruleId: rule.id })
          }
        }}
        onClose={() => setRuleModalRowId(null)}
      />

      <div className="flex flex-col h-full gap-4">
        <div className="flex flex-shrink-0 flex-wrap items-center justify-end gap-2">
          {rows.length >= 2 && (
            <button
              type="button"
              onClick={applyFirstRowToAll}
              disabled={!canApplyFirstRow || isSubmitting}
              className="rounded-md border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50"
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
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
            style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', backgroundColor: 'var(--admin-accent)' }}
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
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

        <Card className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {isRulesLoading ? (
            <ListSkeleton count={3} rowHeight="h-14" />
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-lg"
                style={{ backgroundColor: 'var(--admin-accent-bg)' }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ color: 'var(--admin-accent)' }}
                  aria-hidden="true"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <line x1="19" y1="8" x2="19" y2="14" />
                  <line x1="22" y1="11" x2="16" y2="11" />
                </svg>
              </div>
              <div>
                <p
                  className="text-sm font-semibold"
                  style={{
                    fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                    color: 'var(--admin-text)',
                  }}
                >
                  선택된 학생이 없습니다
                </p>
                <p
                  className="mt-1 text-xs leading-relaxed"
                  style={{
                    fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                    color: 'var(--admin-text-muted)',
                  }}
                >
                  상단 버튼으로 학생을 추가한 뒤
                  <br />
                  규칙과 점수를 입력하세요.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div
                className="hidden items-center gap-3 px-3 pb-2.5 text-[10px] font-semibold uppercase tracking-widest sm:flex"
                style={{ color: 'var(--admin-text-muted)', fontFamily: 'var(--font-space-grotesk)' }}
              >
                <span style={{ width: 160 }}>학생</span>
                <span style={{ flex: 1 }}>상벌점 항목</span>
                <span style={{ flex: 1.1 }}>사유</span>
                <span style={{ width: 32 }} />
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto space-y-2">
                {rows.map((row, index) => (
                  <GrantRowCard
                    key={row.localId}
                    index={index}
                    row={row}
                    selectedRule={
                      row.ruleId === '' ? null : (rulesById.get(row.ruleId) ?? null)
                    }
                    disabled={isSubmitting}
                    onOpenRuleModal={() => setRuleModalRowId(row.localId)}
                    onReasonChange={(reason) =>
                      updateRow(row.localId, { reason })
                    }
                    onRemove={() => removeRow(row.localId)}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={submitEntries}
                disabled={!canSubmit || isSubmitting}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-md px-4 py-2.5 text-sm font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', backgroundColor: 'var(--admin-accent)' }}
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
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
