'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Modal, ModalFooter } from '../ui/modal'
import { Button } from '../ui/button'
import type { SharedMileageRuleSummary, SharedMileageType } from './shared-mileage-types'

type SharedRuleFormModalProps<Rule extends SharedMileageRuleSummary> = {
  open: boolean
  onClose: () => void
  mode: 'create' | 'edit'
  rule?: Rule | null
  categories: string[]
  existingRules: Rule[]
  onSuccess: () => Promise<void> | void
  apiPath: string
  datalistId: string
  allowScoreRange?: boolean
}

export default function SharedRuleFormModal<Rule extends SharedMileageRuleSummary>({
  open,
  onClose,
  mode,
  rule,
  categories,
  existingRules,
  onSuccess,
  apiPath,
  datalistId,
  allowScoreRange = false,
}: SharedRuleFormModalProps<Rule>) {
  const [type, setType] = useState<SharedMileageType>('reward')
  const [category, setCategory] = useState('')
  const [name, setName] = useState('')
  const [defaultScore, setDefaultScore] = useState('')
  const [displayOrder, setDisplayOrder] = useState('')
  const [useRange, setUseRange] = useState(false)
  const [minScore, setMinScore] = useState('')
  const [maxScore, setMaxScore] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!open) {
      return
    }

    if (mode === 'edit' && rule) {
      setType(rule.type)
      setCategory(rule.category)
      setName(rule.name)
      setDefaultScore(String(rule.defaultScore))
      setDisplayOrder(String(rule.displayOrder))
      setUseRange(
        allowScoreRange &&
          rule.minScore !== null &&
          rule.minScore !== undefined &&
          rule.maxScore !== null &&
          rule.maxScore !== undefined,
      )
      setMinScore(
        allowScoreRange && rule.minScore !== null && rule.minScore !== undefined
          ? String(rule.minScore)
          : '',
      )
      setMaxScore(
        allowScoreRange && rule.maxScore !== null && rule.maxScore !== undefined
          ? String(rule.maxScore)
          : '',
      )
    } else {
      setType('reward')
      setCategory('')
      setName('')
      setDefaultScore('')
      setDisplayOrder('')
      setUseRange(false)
      setMinScore('')
      setMaxScore('')
    }

    setError(null)
  }, [allowScoreRange, mode, open, rule])

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) {
      setError('항목명을 입력해 주세요.')
      return
    }

    if (!category.trim()) {
      setError('카테고리를 입력해 주세요.')
      return
    }

    const score = Number(defaultScore)
    if (!defaultScore || !Number.isInteger(score) || score < 1) {
      setError('기본점수는 1 이상의 정수여야 합니다.')
      return
    }

    const order = displayOrder === '' ? undefined : Number(displayOrder)
    if (order !== undefined && (!Number.isInteger(order) || order < 0)) {
      setError('표시순서는 0 이상의 정수여야 합니다.')
      return
    }

    let normalizedMinScore: number | null = null
    let normalizedMaxScore: number | null = null

    if (allowScoreRange && useRange) {
      const parsedMinScore = Number(minScore)
      const parsedMaxScore = Number(maxScore)

      if (
        !minScore ||
        !maxScore ||
        !Number.isInteger(parsedMinScore) ||
        !Number.isInteger(parsedMaxScore) ||
        parsedMinScore < 1 ||
        parsedMaxScore < 1
      ) {
        setError('범위 점수는 1 이상의 정수로 입력해 주세요.')
        return
      }

      if (parsedMinScore > parsedMaxScore) {
        setError('최소점수는 최대점수보다 클 수 없습니다.')
        return
      }

      if (score < parsedMinScore || score > parsedMaxScore) {
        setError('기본점수는 최소점수와 최대점수 범위 안에 있어야 합니다.')
        return
      }

      normalizedMinScore = parsedMinScore
      normalizedMaxScore = parsedMaxScore
    }

    const normalizedType = mode === 'create' ? type : rule?.type
    const normalizedCategory = category.trim()
    const normalizedName = name.trim()
    const duplicatedRule = existingRules.find((existingRule) => {
      if (rule && existingRule.id === rule.id) {
        return false
      }

      return (
        existingRule.type === normalizedType &&
        existingRule.category === normalizedCategory &&
        existingRule.name === normalizedName
      )
    })

    if (duplicatedRule) {
      setError('같은 유형의 카테고리와 항목명이 이미 존재합니다.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    const body: Record<string, unknown> = {
      category: normalizedCategory,
      name: normalizedName,
      defaultScore: score,
    }

    if (mode === 'create') {
      body.type = type
    }

    if (order !== undefined) {
      body.displayOrder = order
    }

    if (allowScoreRange) {
      body.minScore = normalizedMinScore
      body.maxScore = normalizedMaxScore
    }

    try {
      const url = mode === 'create' ? apiPath : `${apiPath}/${rule?.id}`
      const method = mode === 'create' ? 'POST' : 'PATCH'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const result = await response.json().catch(() => null)

      if (!response.ok) {
        setError(result?.message ?? '요청을 처리하지 못했습니다.')
        return
      }

      onClose()
      await onSuccess()
    } catch {
      setError('요청 중 문제가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }, [
    allowScoreRange,
    apiPath,
    category,
    defaultScore,
    displayOrder,
    existingRules,
    maxScore,
    minScore,
    mode,
    name,
    onClose,
    onSuccess,
    rule,
    type,
    useRange,
  ])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'create' ? '항목 추가' : '항목 수정'}
      size="md"
    >
      <div className="space-y-4">
        <div>
          <label
            className="mb-1.5 block text-xs font-semibold"
            style={{
              fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              color: 'var(--fg-muted)',
            }}
          >
            유형
          </label>
          <select
            value={type}
            onChange={(event) => setType(event.target.value as SharedMileageType)}
            disabled={mode === 'edit' || isSubmitting}
            className="h-9 w-full rounded-md border bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              borderColor: 'var(--border)',
              color: 'var(--fg)',
            }}
          >
            <option value="reward">상점</option>
            <option value="penalty">벌점</option>
          </select>
        </div>

        <div>
          <label
            className="mb-1.5 block text-xs font-semibold"
            style={{
              fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              color: 'var(--fg-muted)',
            }}
          >
            카테고리
          </label>
          <input
            type="text"
            list={datalistId}
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            disabled={isSubmitting}
            placeholder="카테고리 입력 또는 선택"
            className="h-9 w-full rounded-md border bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-50"
            style={{
              fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              borderColor: 'var(--border)',
              color: 'var(--fg)',
            }}
          />
          <datalist id={datalistId}>
            {categories.map((item) => (
              <option key={item} value={item} />
            ))}
          </datalist>
        </div>

        <div>
          <label
            className="mb-1.5 block text-xs font-semibold"
            style={{
              fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              color: 'var(--fg-muted)',
            }}
          >
            항목명
          </label>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            disabled={isSubmitting}
            placeholder="항목명 입력"
            className="h-9 w-full rounded-md border bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-50"
            style={{
              fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              borderColor: 'var(--border)',
              color: 'var(--fg)',
            }}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label
              className="mb-1.5 block text-xs font-semibold"
              style={{
                fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                color: 'var(--fg-muted)',
              }}
            >
              기본점수
            </label>
            <input
              type="number"
              min="1"
              value={defaultScore}
              onChange={(event) => setDefaultScore(event.target.value)}
              disabled={isSubmitting}
              placeholder="점수"
              className="h-9 w-full rounded-md border bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-50"
              style={{
                fontFamily: 'var(--font-space-grotesk)',
                borderColor: 'var(--border)',
                color: 'var(--fg)',
              }}
            />
          </div>

          <div>
            <label
              className="mb-1.5 block text-xs font-semibold"
              style={{
                fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                color: 'var(--fg-muted)',
              }}
            >
              표시순서 (선택)
            </label>
            <input
              type="number"
              min="0"
              value={displayOrder}
              onChange={(event) => setDisplayOrder(event.target.value)}
              disabled={isSubmitting}
              placeholder="자동"
              className="h-9 w-full rounded-md border bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-50"
              style={{
                fontFamily: 'var(--font-space-grotesk)',
                borderColor: 'var(--border)',
                color: 'var(--fg)',
              }}
            />
          </div>
        </div>

        {allowScoreRange && (
          <>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={useRange}
                onChange={(event) => setUseRange(event.target.checked)}
                disabled={isSubmitting}
                style={{ accentColor: 'var(--accent)' }}
              />
              <span
                className="text-xs font-medium"
                style={{
                  fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                  color: 'var(--fg)',
                }}
              >
                범위 점수 사용
              </span>
            </label>

            {useRange && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label
                    className="mb-1.5 block text-xs font-semibold"
                    style={{
                      fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                      color: 'var(--fg-muted)',
                    }}
                  >
                    최소점수
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={minScore}
                    onChange={(event) => setMinScore(event.target.value)}
                    disabled={isSubmitting}
                    placeholder="최소점수"
                    className="h-9 w-full rounded-md border bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-50"
                    style={{
                      fontFamily: 'var(--font-space-grotesk)',
                      borderColor: 'var(--border)',
                      color: 'var(--fg)',
                    }}
                  />
                </div>

                <div>
                  <label
                    className="mb-1.5 block text-xs font-semibold"
                    style={{
                      fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                      color: 'var(--fg-muted)',
                    }}
                  >
                    최대점수
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={maxScore}
                    onChange={(event) => setMaxScore(event.target.value)}
                    disabled={isSubmitting}
                    placeholder="최대점수"
                    className="h-9 w-full rounded-md border bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)] disabled:opacity-50"
                    style={{
                      fontFamily: 'var(--font-space-grotesk)',
                      borderColor: 'var(--border)',
                      color: 'var(--fg)',
                    }}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {error && (
          <p
            className="text-xs"
            style={{
              fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              color: 'var(--penalty)',
            }}
          >
            {error}
          </p>
        )}
      </div>

      <ModalFooter>
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
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting && (
            <Loader2 size={14} className="animate-spin" aria-hidden="true" />
          )}
          {mode === 'create' ? '추가' : '저장'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
