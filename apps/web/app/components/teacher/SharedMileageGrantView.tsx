'use client'

import { useMemo, useRef, useState } from 'react'
import { Card, NoticeBox } from '../mileage/shared'
import AccessDeniedOverlay from '../ui/AccessDeniedOverlay'
import { Button } from '../ui/button'
import { UserPlusCompactIcon, UserPlusFeatureIcon } from '../ui/icons'
import { ListEmptyState, LoadingSpinner } from '../ui/list'
import SuccessModal from '../ui/success-modal'
import AnimatedCheckbox from '../ui/animated-checkbox'
import type {
  SharedMileageRuleSummary,
  SharedMileageStudentOption,
} from './shared-mileage-types'

type SharedGrantRow<Student extends SharedMileageStudentOption> = {
  localId: number
  student: Student
  ruleId: number | ''
  score: number | ''
  reason: string
}

type StudentModalRenderProps<Student extends SharedMileageStudentOption> = {
  isOpen: boolean
  addedStudentIds: Set<string>
  onClose: () => void
  onConfirm: (students: Student[]) => void
}

type RuleModalRenderProps<Rule extends SharedMileageRuleSummary> = {
  isOpen: boolean
  rewardRules: Rule[]
  penaltyRules: Rule[]
  currentRuleId: number | ''
  onSelectRule: (selection: { ruleId: number; score?: number }) => void
  onClose: () => void
}

type RowCardRenderProps<
  Student extends SharedMileageStudentOption,
  Rule extends SharedMileageRuleSummary,
  Row extends SharedGrantRow<Student>,
> = {
  index: number
  row: Row
  selectedRule: Rule | null
  disabled?: boolean
  readOnly?: boolean
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  onOpenRuleModal: () => void
  onReasonChange: (reason: string) => void
  onRemove: () => void
}

type SharedMileageGrantViewProps<
  Student extends SharedMileageStudentOption,
  Rule extends SharedMileageRuleSummary,
  Row extends SharedGrantRow<Student>,
  Payload,
> = {
  rules: Rule[]
  isRulesLoading: boolean
  rulesError: string | null
  isReadOnly?: boolean
  accessOverlayMessage?: string
  createRow: (localId: number, student: Student) => Row
  buildPayload: (rows: Row[]) => Payload
  submitPath: string
  submitErrorMessage: string
  submitRequestErrorMessage: string
  submitSuccessMessage: string
  emptyDescription: string
  submitIdleLabel: (rowCount: number) => string
  submitLoadingLabel?: string
  renderStudentSelectionModal: (
    props: StudentModalRenderProps<Student>,
  ) => React.ReactNode
  renderRuleSelectionModal: (
    props: RuleModalRenderProps<Rule>,
  ) => React.ReactNode
  renderGrantRowCard: (
    props: RowCardRenderProps<Student, Rule, Row>,
  ) => React.ReactNode
}

export default function SharedMileageGrantView<
  Student extends SharedMileageStudentOption,
  Rule extends SharedMileageRuleSummary,
  Row extends SharedGrantRow<Student>,
  Payload,
>({
  rules,
  isRulesLoading,
  rulesError,
  isReadOnly = false,
  accessOverlayMessage,
  createRow,
  buildPayload,
  submitPath,
  submitErrorMessage,
  submitRequestErrorMessage,
  submitSuccessMessage,
  emptyDescription,
  submitIdleLabel,
  submitLoadingLabel = '부여 중...',
  renderStudentSelectionModal,
  renderRuleSelectionModal,
  renderGrantRowCard,
}: SharedMileageGrantViewProps<Student, Rule, Row, Payload>) {
  const [rows, setRows] = useState<Row[]>([])
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false)
  const [ruleModalRowId, setRuleModalRowId] = useState<number | null>(null)
  const [errorModal, setErrorModal] = useState<{ open: boolean; message: string }>({
    open: false,
    message: '',
  })
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
    if (!firstRow || firstRow.ruleId === '') {
      return false
    }

    return [...checkedRows].some((rowId) => rowId !== firstRow.localId)
  }, [checkedRows, rows])

  const canSubmit =
    !isReadOnly &&
    rows.length > 0 &&
    !isRulesLoading &&
    rows.every((row) => row.ruleId !== '')

  function handleStudentsAdded(students: Student[]) {
    setRows((previousRows) => {
      const existing = new Set(
        previousRows.map((row) => row.student.studentId),
      )
      const nextStudents = students.filter(
        (student) => !existing.has(student.studentId),
      )

      return [
        ...previousRows,
        ...nextStudents.map((student) =>
          createRow(nextRowIdRef.current++, student),
        ),
      ]
    })
    setErrorModal({ open: false, message: '' })
    setIsStudentModalOpen(false)
  }

  function updateRow(localId: number, patch: Partial<Row>) {
    setRows((previousRows) =>
      previousRows.map((row) => {
        if (row.localId !== localId) {
          return row
        }

        const nextRow = { ...row, ...patch }

        if (patch.ruleId !== undefined) {
          if (patch.ruleId === '') {
            nextRow.score = '' as Row['score']
          } else if (patch.score === undefined) {
            const rule = rulesById.get(patch.ruleId)
            nextRow.score = (rule?.defaultScore ?? nextRow.score) as Row['score']
          }
        }

        return nextRow
      }),
    )
  }

  function removeRow(localId: number) {
    setRows((previousRows) =>
      previousRows.filter((row) => row.localId !== localId),
    )
    setCheckedRows((previousRows) => {
      const nextRows = new Set(previousRows)
      nextRows.delete(localId)
      return nextRows
    })
  }

  function toggleRow(localId: number) {
    setCheckedRows((previousRows) => {
      const nextRows = new Set(previousRows)
      if (nextRows.has(localId)) {
        nextRows.delete(localId)
      } else {
        nextRows.add(localId)
      }
      return nextRows
    })
  }

  function toggleAll() {
    setCheckedRows((previousRows) =>
      previousRows.size === rows.length
        ? new Set()
        : new Set(rows.map((row) => row.localId)),
    )
  }

  function applyFirstRowToSelected() {
    const firstRow = rows[0]
    if (!firstRow || firstRow.ruleId === '' || checkedRows.size === 0) {
      return
    }

    setRows((previousRows) =>
      previousRows.map((row) =>
        row.localId === firstRow.localId || !checkedRows.has(row.localId)
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
    setErrorModal({ open: false, message: '' })

    try {
      const response = await fetch(submitPath, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(rows)),
      })
      const result = await response.json().catch(() => null)

      if (!response.ok) {
        setErrorModal({
          open: true,
          message: result?.message ?? submitErrorMessage,
        })
        return
      }

      setRows([])
      setCheckedRows(new Set())
      setSuccessModal({
        open: true,
        message: result?.message ?? submitSuccessMessage,
      })
    } catch {
      setErrorModal({ open: true, message: submitRequestErrorMessage })
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
      {renderStudentSelectionModal({
        isOpen: isStudentModalOpen,
        addedStudentIds,
        onClose: () => setIsStudentModalOpen(false),
        onConfirm: handleStudentsAdded,
      })}

      {renderRuleSelectionModal({
        isOpen: ruleModalRowId !== null,
        rewardRules,
        penaltyRules,
        currentRuleId,
        onSelectRule: ({ ruleId, score }) => {
          if (ruleModalRowId !== null) {
            updateRow(
              ruleModalRowId,
              {
                ruleId,
                ...(score !== undefined ? { score: score as Row['score'] } : {}),
              } as Partial<Row>,
            )
          }
        },
        onClose: () => setRuleModalRowId(null),
      })}

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
        {isReadOnly && accessOverlayMessage && (
          <AccessDeniedOverlay message={accessOverlayMessage} />
        )}
        {rulesError && <NoticeBox type="error" message={rulesError} />}

        {!isReadOnly && (
          <div className="flex flex-shrink-0 flex-wrap items-center justify-end gap-2">
            {rows.length >= 2 && (
              <div className="flex items-center gap-2">
                <AnimatedCheckbox
                  checked={checkedRows.size === rows.length && rows.length > 0}
                  onChange={toggleAll}
                  disabled={isSubmitting || isReadOnly}
                  size={18}
                />
                <span
                  className="text-xs"
                  style={{
                    fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                    color: 'var(--fg-muted)',
                  }}
                >
                  전체 선택
                </span>
              </div>
            )}
            {rows.length >= 2 && (
              <Button
                variant="accent"
                size="sm"
                onClick={applyFirstRowToSelected}
                disabled={!canApplyFirstRow || isSubmitting || isReadOnly}
              >
                선택 항목에 적용
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              icon={<UserPlusCompactIcon />}
              onClick={() => {
                if (!isReadOnly) {
                  setIsStudentModalOpen(true)
                }
              }}
              disabled={isSubmitting || isReadOnly}
            >
              학생 추가
            </Button>
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
              description={emptyDescription}
            />
          ) : (
            <>
              <div
                className="hidden items-center gap-3 px-3 pb-2.5 text-[10px] font-semibold uppercase tracking-widest sm:flex"
                style={{
                  color: 'var(--admin-text-muted)',
                  fontFamily: 'var(--font-space-grotesk)',
                }}
              >
                <span style={{ width: 160 }}>학생</span>
                <span style={{ flex: 1 }}>상벌점 항목</span>
                <span style={{ flex: 1.1 }}>사유</span>
                <span style={{ width: 32 }} />
              </div>

              <div className="flex-1 min-h-0 space-y-2">
                {rows.map((row, index) =>
                  renderGrantRowCard({
                    index,
                    row,
                    selectedRule:
                      row.ruleId === ''
                        ? null
                        : (rulesById.get(row.ruleId) ?? null),
                    disabled: isSubmitting,
                    readOnly: isReadOnly,
                    checked: checkedRows.has(row.localId),
                    onCheckedChange: () => toggleRow(row.localId),
                    onOpenRuleModal: () => {
                      if (!isReadOnly) {
                        setRuleModalRowId(row.localId)
                      }
                    },
                    onReasonChange: (reason) =>
                      updateRow(row.localId, { reason } as Partial<Row>),
                    onRemove: () => {
                      if (!isReadOnly) {
                        removeRow(row.localId)
                      }
                    },
                  }),
                )}
              </div>

              <div className="mt-4">
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  loading={isSubmitting}
                  disabled={!canSubmit || isSubmitting}
                  onClick={() => {
                    void submitEntries()
                  }}
                >
                  {isSubmitting ? submitLoadingLabel : submitIdleLabel(rows.length)}
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </>
  )
}
