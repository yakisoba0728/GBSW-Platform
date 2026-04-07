'use client'

import { AnimatedListItem } from '../ui/list'
import { XIcon } from '../ui/icons'
import AnimatedCheckbox from '../ui/animated-checkbox'
import Tooltip from '../ui/tooltip'
import { inputStyle } from '../mileage/shared'
import type {
  DormMileageRuleSummary,
  DormMileageStudentOption,
} from './dorm-mileage-types'

export type DormGrantRow = {
  localId: number
  student: DormMileageStudentOption
  ruleId: number | ''
  score: number | ''
  reason: string
}

type DormGrantRowCardProps = {
  index: number
  row: DormGrantRow
  selectedRule: DormMileageRuleSummary | null
  disabled?: boolean
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  onOpenRuleModal: () => void
  onReasonChange: (reason: string) => void
  onRemove: () => void
}

export default function DormGrantRowCard({
  index,
  row,
  selectedRule,
  disabled = false,
  checked,
  onCheckedChange,
  onOpenRuleModal,
  onReasonChange,
  onRemove,
}: DormGrantRowCardProps) {
  const leftBorderColor =
    selectedRule === null
      ? 'var(--admin-border)'
      : selectedRule.type === 'reward'
        ? '#16a34a'
        : '#dc2626'

  const displayScore =
    row.score === ''
      ? selectedRule?.defaultScore ?? ''
      : row.score

  const ruleTrigger = (
    <button
      type="button"
      onClick={onOpenRuleModal}
      disabled={disabled}
      className="flex w-full items-center gap-2 rounded-md border px-3 py-2 text-sm text-left transition-colors disabled:cursor-not-allowed disabled:opacity-60"
      style={{
        ...inputStyle,
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
              backgroundColor:
                selectedRule.type === 'reward'
                  ? 'rgba(34,197,94,0.15)'
                  : 'rgba(239,68,68,0.15)',
              color: selectedRule.type === 'reward' ? '#15803d' : '#b91c1c',
              border: `1px solid ${
                selectedRule.type === 'reward'
                  ? 'rgba(34,197,94,0.3)'
                  : 'rgba(239,68,68,0.3)'
              }`,
              fontFamily: 'var(--font-space-grotesk)',
              lineHeight: '1.4',
            }}
          >
            {selectedRule.type === 'reward' ? '+' : '-'}
            {displayScore}점
          </span>
          <Tooltip content={`${selectedRule.name} — ${selectedRule.category}`}>
            <span
              className="min-w-0 flex-1 truncate"
              style={{
                color: 'var(--admin-text)',
                fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              }}
            >
              {selectedRule.name}
            </span>
          </Tooltip>
          <span
            className="flex-shrink-0 text-[11px]"
            style={{
              color: 'var(--admin-text-muted)',
              fontFamily: 'var(--font-noto-sans-kr), sans-serif',
            }}
          >
            {selectedRule.category}
          </span>
        </>
      ) : (
        <span
          style={{
            color: 'var(--admin-text-muted)',
            fontFamily: 'var(--font-noto-sans-kr), sans-serif',
          }}
        >
          항목 선택
        </span>
      )}
    </button>
  )

  return (
    <AnimatedListItem
      index={index}
      className="rounded-lg border px-3 py-3"
      style={{
        borderColor: 'var(--admin-border)',
        borderLeft: `3px solid ${leftBorderColor}`,
        backgroundColor: 'var(--admin-bg)',
        transition: 'border-left-color 0.2s ease',
      }}
    >
      <div className="sm:hidden">
        <div className="mb-2.5 flex items-start justify-between gap-2">
          <AnimatedCheckbox
            checked={checked}
            onChange={onCheckedChange}
            disabled={disabled}
            size={18}
          />
          <div>
            <div className="flex items-baseline gap-1.5">
              <span
                className="text-sm font-semibold"
                style={{
                  fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                  color: 'var(--admin-text)',
                }}
              >
                {row.student.name}
              </span>
              <span
                className="text-[11px]"
                style={{
                  fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                  color: 'var(--admin-text-muted)',
                }}
              >
                {row.student.grade ? `${row.student.grade}학년 ` : ''}
                {row.student.classNumber}반 {row.student.studentNumber}번
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onRemove}
            disabled={disabled}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-colors hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-50"
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
          onChange={(event) => onReasonChange(event.target.value)}
          disabled={disabled}
          className="w-full rounded-md border px-3 py-2 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60"
          style={inputStyle}
          placeholder="사유 입력 (선택)"
        />
      </div>

      <div className="hidden items-center gap-3 sm:flex">
        <AnimatedCheckbox
          checked={checked}
          onChange={onCheckedChange}
          disabled={disabled}
          size={18}
        />
        <div className="w-[160px] flex-shrink-0 overflow-hidden">
          <div className="flex min-w-0 items-baseline gap-1">
            <span
              className="truncate text-sm font-semibold"
              style={{
                fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                color: 'var(--admin-text)',
                flexShrink: 0,
                maxWidth: '55%',
              }}
            >
              {row.student.name}
            </span>
            <span
              className="truncate text-[11px]"
              style={{
                fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                color: 'var(--admin-text-muted)',
              }}
            >
              {row.student.grade ? `${row.student.grade}학년 ` : ''}
              {row.student.classNumber}반 {row.student.studentNumber}번
            </span>
          </div>
        </div>

        <div className="min-w-0 flex-1 overflow-hidden">{ruleTrigger}</div>

        <div className="flex-[1.1]">
          <input
            type="text"
            value={row.reason}
            onChange={(event) => onReasonChange(event.target.value)}
            disabled={disabled}
            className="w-full rounded-md border px-3 py-2 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-60"
            style={inputStyle}
            placeholder="사유 입력 (선택)"
          />
        </div>

        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors hover:opacity-70 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ color: '#dc2626' }}
          aria-label="행 삭제"
        >
          <XIcon />
        </button>
      </div>
    </AnimatedListItem>
  )
}
