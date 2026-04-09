'use client'

import { useEffect, useState } from 'react'
import { ModalBase } from '../ui/modal'
import { XIcon } from '../ui/icons'
import { Button } from '../ui/button'
import { IconButton } from '../ui/primitives'
import { NoticeBox, formatAwardedAt, getSchoolLabel, inputStyle } from '../mileage/shared'
import type { SharedMileageHistoryItem } from './shared-mileage-types'

type SharedEditEntryModalProps<Item extends SharedMileageHistoryItem> = {
  isOpen: boolean
  item: Item | null
  onClose: () => void
  onSaved: (message: string) => Promise<void>
  apiPath: string
  title: string
  saveErrorMessage: string
  saveSuccessMessage: string
  submitErrorMessage: string
  showSchoolLabel?: boolean
}

export default function SharedEditEntryModal<Item extends SharedMileageHistoryItem>({
  isOpen,
  item,
  onClose,
  onSaved,
  apiPath,
  title,
  saveErrorMessage,
  saveSuccessMessage,
  submitErrorMessage,
  showSchoolLabel = false,
}: SharedEditEntryModalProps<Item>) {
  const [reason, setReason] = useState(item?.reason ?? '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (item) {
      setReason(item.reason ?? '')
    }
    setError(null)
  }, [item])

  async function handleSubmit() {
    if (!item) {
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`${apiPath}/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      const result = await response.json().catch(() => null)

      if (!response.ok) {
        setError(result?.message ?? saveErrorMessage)
        return
      }

      await onSaved(result?.message ?? saveSuccessMessage)
    } catch {
      setError(submitErrorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const readonlyStyle: React.CSSProperties = {
    ...inputStyle,
    color: 'var(--fg-muted)',
    cursor: 'default',
    opacity: 0.8,
  }

  if (!item && !isOpen) {
    return null
  }

  return (
    <ModalBase isOpen={isOpen} onClose={onClose} maxWidth="max-w-lg">
      <div
        className="flex flex-col overflow-hidden rounded-2xl border"
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
              {title}
            </p>
            {item && (
              <p
                className="mt-0.5 text-xs"
                style={{
                  fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                  color: 'var(--fg-muted)',
                }}
              >
                {item.studentName} · {item.grade ? `${item.grade}학년 ` : ''}
                {item.classNumber}반 {item.studentNumber}번
                {showSchoolLabel && item.school ? ` · ${getSchoolLabel(item.school)}` : ''}
              </p>
            )}
          </div>
          <IconButton icon={<XIcon />} label="닫기" onClick={onClose} />
        </div>

        {item && (
          <div className="px-5 py-5">
            {error && (
              <div className="mb-4">
                <NoticeBox type="error" message={error} />
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <span
                  className="text-xs font-medium"
                  style={{
                    fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                    color: 'var(--fg-muted)',
                  }}
                >
                  상벌점 항목
                </span>
                <div
                  className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                  style={readonlyStyle}
                >
                  <span
                    className="flex-shrink-0 rounded-md px-2 py-0.5 text-xs font-bold"
                    style={{
                      backgroundColor:
                        item.type === 'reward'
                          ? 'var(--reward-bg-hover)'
                          : 'var(--penalty-bg-hover)',
                      color: item.type === 'reward' ? '#15803d' : '#b91c1c',
                      border: `1px solid ${item.type === 'reward' ? 'var(--reward-bg-active)' : 'var(--penalty-bg-active)'}`,
                      fontFamily: 'var(--font-space-grotesk)',
                    }}
                  >
                    {item.type === 'reward' ? '+' : '-'}
                    {item.score}점
                  </span>
                  <span
                    className="min-w-0 flex-1 truncate"
                    style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
                  >
                    {item.ruleName}
                  </span>
                  <span
                    className="flex-shrink-0 text-[11px]"
                    style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
                  >
                    {item.ruleCategory}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <span
                    className="text-xs font-medium"
                    style={{
                      fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                      color: 'var(--fg-muted)',
                    }}
                  >
                    부여 일시
                  </span>
                  <p className="rounded-lg border px-3 py-2 text-sm" style={readonlyStyle}>
                    {formatAwardedAt(item.awardedAt)}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <span
                    className="text-xs font-medium"
                    style={{
                      fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                      color: 'var(--fg-muted)',
                    }}
                  >
                    부여 교사
                  </span>
                  <p className="rounded-lg border px-3 py-2 text-sm" style={readonlyStyle}>
                    {item.teacherName}
                  </p>
                </div>
              </div>

              <label className="space-y-1.5">
                <span
                  className="text-xs font-medium"
                  style={{
                    fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                    color: 'var(--fg-muted)',
                  }}
                >
                  사유
                </span>
                <input
                  type="text"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  disabled={isSubmitting}
                  className="w-full rounded-lg border px-3 py-2 text-sm outline-none"
                  style={inputStyle}
                  placeholder="사유 입력 (선택)"
                  autoFocus
                />
              </label>
            </div>
          </div>
        )}

        <div
          className="flex items-center justify-end gap-2 px-5 py-4"
          style={{ borderTop: '1px solid var(--admin-border)' }}
        >
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button
            variant="primary"
            size="sm"
            loading={isSubmitting}
            disabled={isSubmitting || !item}
            onClick={() => void handleSubmit()}
          >
            저장
          </Button>
        </div>
      </div>
    </ModalBase>
  )
}
