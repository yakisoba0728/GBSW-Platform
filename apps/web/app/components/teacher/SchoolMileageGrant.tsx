'use client'

import { useMemo, useRef, useState } from 'react'
import { ListEmptyState, LoadingSpinner } from '../ui/list'
import { Button } from '../ui/button'
import SuccessModal from '../ui/success-modal'
import AnimatedCheckbox from '../ui/animated-checkbox'
import { UserPlusIcon } from '../ui/icons'
import RuleSelectionModal from './RuleSelectionModal'
import StudentSelectionModal from './StudentSelectionModal'
import GrantRowCard, { type GrantRow } from './GrantRowCard'
import { Card, NoticeBox } from '../mileage/shared'
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
  const [errorModal, setErrorModal] = useState<{ open: boolean; message: string }>({ open: false, message: '' })
  const [successModal, setSuccessModal] = useState<{
    open: boolean
    message: string
  }>({ open: false, message: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [checkedRows, setCheckedRows] = useState<Set<number>>(new Set())
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

  const canApplyFirstRow = useMemo(() => {
    const firstRow = rows[0]
    if (!firstRow || firstRow.ruleId === '') return false
    return [...checkedRows].some((rowId) => rowId !== firstRow.localId)
  }, [checkedRows, rows])
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
    setErrorModal({ open: false, message: '' })
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
    setCheckedRows((prev) => {
      const next = new Set(prev)
      next.delete(localId)
      return next
    })
  }

  function toggleRow(localId: number) {
    setCheckedRows((prev) => {
      const next = new Set(prev)
      if (next.has(localId)) next.delete(localId)
      else next.add(localId)
      return next
    })
  }

  function toggleAll() {
    setCheckedRows((prev) =>
      prev.size === rows.length ? new Set() : new Set(rows.map((r) => r.localId)),
    )
  }

  function applyFirstRowToSelected() {
    const firstRow = rows[0]
    if (!firstRow || firstRow.ruleId === '' || checkedRows.size === 0) return
    setRows((prev) =>
      prev.map((row) =>
        row.localId === firstRow.localId || !checkedRows.has(row.localId)
          ? row
          : { ...row, ruleId: firstRow.ruleId, score: firstRow.score, reason: firstRow.reason },
      ),
    )
  }

  async function submitEntries() {
    if (!canSubmit) {
      return
    }

    setIsSubmitting(true)
    setErrorModal({ open: false, message: '' })

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
        setErrorModal({ open: true, message: result?.message ?? '상벌점 부여에 실패했습니다.' })
        return
      }

      setRows([])
      setCheckedRows(new Set())
      setSuccessModal({
        open: true,
        message: result?.message ?? '상벌점이 부여되었습니다.',
      })
    } catch {
      setErrorModal({ open: true, message: '상벌점 부여 요청 중 문제가 발생했습니다.' })
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

      <SuccessModal
        open={successModal.open}
        onClose={() => setSuccessModal({ open: false, message: '' })}
        type="success"
        title="부여 완료"
        description={successModal.message}
      />

      <SuccessModal
        open={errorModal.open}
        onClose={() => setErrorModal({ open: false, message: '' })}
        type="error"
        title="부여 실패"
        description={errorModal.message}
      />

      <div className="flex flex-col h-full gap-4">
        {rulesError && <NoticeBox type="error" message={rulesError} />}

        <div className="flex flex-shrink-0 flex-wrap items-center justify-end gap-2">
          {rows.length >= 2 && (
            <div className="flex items-center gap-2">
              <AnimatedCheckbox
                checked={checkedRows.size === rows.length && rows.length > 0}
                onChange={toggleAll}
                disabled={isSubmitting}
                size={18}
              />
              <span className="text-xs" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--fg-muted)' }}>
                전체 선택
              </span>
            </div>
          )}
          {rows.length >= 2 && (
            <Button variant="accent" size="sm" onClick={applyFirstRowToSelected} disabled={!canApplyFirstRow || isSubmitting}>선택 항목에 적용</Button>
          )}
          <Button variant="primary" size="sm" icon={<UserPlusIcon size={13} strokeWidth={2.5} />} onClick={() => setIsStudentModalOpen(true)} disabled={isSubmitting}>학생 추가</Button>
        </div>

        <Card className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {isRulesLoading ? (
            <div className="flex h-full min-h-[120px] items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : rows.length === 0 ? (
            <ListEmptyState
              fill
              icon={<div className="flex h-12 w-12 items-center justify-center rounded-lg" style={{ backgroundColor: 'var(--accent-subtle)' }}><UserPlusIcon size={24} strokeWidth={1.7} style={{ color: 'var(--accent)' }} /></div>}
              title="선택된 학생이 없습니다"
              description="상단 버튼으로 학생을 추가한 뒤 규칙과 점수를 입력하세요."
            />
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

              <div className="flex-1 min-h-0 space-y-2">
                {rows.map((row, index) => (
                  <GrantRowCard
                    key={row.localId}
                    index={index}
                    row={row}
                    selectedRule={
                      row.ruleId === '' ? null : (rulesById.get(row.ruleId) ?? null)
                    }
                    disabled={isSubmitting}
                    checked={checkedRows.has(row.localId)}
                    onCheckedChange={() => toggleRow(row.localId)}
                    onOpenRuleModal={() => setRuleModalRowId(row.localId)}
                    onReasonChange={(reason) =>
                      updateRow(row.localId, { reason })
                    }
                    onRemove={() => removeRow(row.localId)}
                  />
                ))}
              </div>

              <div className="mt-4">
                <Button variant="primary" size="md" fullWidth loading={isSubmitting} disabled={!canSubmit || isSubmitting} onClick={submitEntries}>
                  {isSubmitting ? '부여 중...' : `전체 부여하기 (${rows.length}명)`}
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </>
  )
}
