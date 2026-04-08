'use client'

import { useMemo, useRef, useState } from 'react'
import { ListEmptyState, LoadingSpinner } from '../ui/list'
import { Button } from '../ui/button'
import SuccessModal from '../ui/success-modal'
import AnimatedCheckbox from '../ui/animated-checkbox'
import { UserPlusCompactIcon, UserPlusFeatureIcon } from '../ui/icons'
import DormRuleSelectionModal from './DormRuleSelectionModal'
import DormStudentSelectionModal from './DormStudentSelectionModal'
import DormGrantRowCard, { type DormGrantRow } from './DormGrantRowCard'
import { Card, NoticeBox } from '../mileage/shared'
import AccessDeniedOverlay from '../ui/AccessDeniedOverlay'
import { useDormRulesContext } from '../dorm-mileage/dorm-rules-context'
import type {
  CreateDormMileageEntriesPayload,
  DormMileageRuleSummary,
  DormMileageStudentOption,
} from './dorm-mileage-types'

export default function DormMileageGrant({
  isDormTeacher,
}: {
  isDormTeacher: boolean
}) {
  const { rules, isRulesLoading, rulesError } = useDormRulesContext()

  const [rows, setRows] = useState<DormGrantRow[]>([])
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
    isDormTeacher && rows.length > 0 && !isRulesLoading && rows.every((row) => row.ruleId !== '')
  const isReadOnly = !isDormTeacher

  function handleStudentsAdded(students: DormMileageStudentOption[]) {
    setRows((prev) => {
      const existing = new Set(prev.map((row) => row.student.studentId))
      const nextStudents = students.filter(
        (student) => !existing.has(student.studentId),
      )

      return [
        ...prev,
        ...nextStudents.map<DormGrantRow>((student) => ({
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

  function updateRow(localId: number, patch: Partial<DormGrantRow>) {
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

  function handleRuleSelected(rule: DormMileageRuleSummary, score: number) {
    if (ruleModalRowId !== null) {
      updateRow(ruleModalRowId, { ruleId: rule.id, score })
    }
  }

  async function submitEntries() {
    if (!canSubmit) {
      return
    }

    setIsSubmitting(true)
    setErrorModal({ open: false, message: '' })

    const payload: CreateDormMileageEntriesPayload = {
      entries: rows.map((row) => ({
        studentId: row.student.studentId,
        ruleId: Number(row.ruleId),
        score: Number(row.score),
        ...(row.reason.trim() ? { reason: row.reason.trim() } : {}),
      })),
    }

    try {
      const response = await fetch('/api/teacher/dorm-mileage/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const result = await response.json().catch(() => null)

      if (!response.ok) {
        setErrorModal({ open: true, message: result?.message ?? '기숙사 상벌점 부여에 실패했습니다.' })
        return
      }

      setRows([])
      setCheckedRows(new Set())
      setSuccessModal({
        open: true,
        message: result?.message ?? '기숙사 상벌점이 부여되었습니다.',
      })
    } catch {
      setErrorModal({ open: true, message: '기숙사 상벌점 부여 요청 중 문제가 발생했습니다.' })
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
      <DormStudentSelectionModal
        isOpen={isStudentModalOpen}
        addedStudentIds={addedStudentIds}
        onClose={() => setIsStudentModalOpen(false)}
        onConfirm={handleStudentsAdded}
      />

      <DormRuleSelectionModal
        isOpen={ruleModalRowId !== null}
        rewardRules={rewardRules}
        penaltyRules={penaltyRules}
        currentRuleId={currentRuleId}
        onSelect={handleRuleSelected}
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

      <div className="relative flex flex-col h-full gap-4">
        {!isDormTeacher && <AccessDeniedOverlay message="사감 교사만 기숙사 상벌점을 부여할 수 있습니다." />}
        {rulesError && <NoticeBox type="error" message={rulesError} />}

        {isDormTeacher && (
          <div className="flex flex-shrink-0 flex-wrap items-center justify-end gap-2">
            {rows.length >= 2 && (
              <div className="flex items-center gap-2">
                <AnimatedCheckbox
                  checked={checkedRows.size === rows.length && rows.length > 0}
                  onChange={toggleAll}
                  disabled={isSubmitting || isReadOnly}
                  size={18}
                />
                <span className="text-xs" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--fg-muted)' }}>
                  전체 선택
                </span>
              </div>
            )}
            {rows.length >= 2 && (
              <Button variant="accent" size="sm" onClick={applyFirstRowToSelected} disabled={!canApplyFirstRow || isSubmitting || isReadOnly}>선택 항목에 적용</Button>
            )}
            <Button variant="primary" size="sm" icon={<UserPlusCompactIcon />} onClick={() => { if (!isReadOnly) setIsStudentModalOpen(true) }} disabled={isSubmitting || isReadOnly}>학생 추가</Button>
          </div>
        )}

        <Card className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {isRulesLoading ? (
            <div className="flex h-full min-h-[120px] items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : rows.length === 0 ? (
            <ListEmptyState
              fill
              icon={<UserPlusFeatureIcon />}
              iconContained
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
                  <DormGrantRowCard
                    key={row.localId}
                    index={index}
                    row={row}
                    selectedRule={
                      row.ruleId === '' ? null : (rulesById.get(row.ruleId) ?? null)
                    }
                    disabled={isSubmitting}
                    readOnly={isReadOnly}
                    checked={checkedRows.has(row.localId)}
                    onCheckedChange={() => toggleRow(row.localId)}
                    onOpenRuleModal={() => {
                      if (!isReadOnly) {
                        setRuleModalRowId(row.localId)
                      }
                    }}
                    onReasonChange={(reason) =>
                      updateRow(row.localId, { reason })
                    }
                    onRemove={() => {
                      if (!isReadOnly) {
                        removeRow(row.localId)
                      }
                    }}
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
