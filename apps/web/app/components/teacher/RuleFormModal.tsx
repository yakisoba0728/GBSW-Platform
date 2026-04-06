'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Modal, ModalFooter } from '../ui/modal'
import { Button } from '../ui/button'
import type { MileageType, SchoolMileageRuleSummary } from './school-mileage-types'

interface RuleFormModalProps {
  open: boolean
  onClose: () => void
  mode: 'create' | 'edit'
  rule?: SchoolMileageRuleSummary | null
  categories: string[]
  existingRules: SchoolMileageRuleSummary[]
  onSuccess: () => Promise<void> | void
  apiPath?: string
}

export default function RuleFormModal({
  open,
  onClose,
  mode,
  rule,
  categories,
  existingRules,
  onSuccess,
  apiPath = '/api/teacher/school-mileage/rules',
}: RuleFormModalProps) {
  const [type, setType] = useState<MileageType>('reward')
  const [category, setCategory] = useState('')
  const [name, setName] = useState('')
  const [defaultScore, setDefaultScore] = useState('')
  const [displayOrder, setDisplayOrder] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return

    if (mode === 'edit' && rule) {
      setType(rule.type)
      setCategory(rule.category)
      setName(rule.name)
      setDefaultScore(String(rule.defaultScore))
      setDisplayOrder(String(rule.displayOrder))
    } else {
      setType('reward')
      setCategory('')
      setName('')
      setDefaultScore('')
      setDisplayOrder('')
    }
    setError(null)
  }, [open, mode, rule])

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

    const order =
      displayOrder === '' ? undefined : Number(displayOrder)
    if (
      order !== undefined &&
      (!Number.isInteger(order) || order < 0)
    ) {
      setError('표시순서는 0 이상의 정수여야 합니다.')
      return
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

    try {
      const url =
        mode === 'create'
          ? apiPath
          : `${apiPath}/${rule?.id}`
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
    category,
    defaultScore,
    displayOrder,
    existingRules,
    mode,
    name,
    onClose,
    onSuccess,
    apiPath,
    rule,
    type,
  ])

  const datalistId = 'rule-category-list'

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
            onChange={(e) => setType(e.target.value as MileageType)}
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
            onChange={(e) => setCategory(e.target.value)}
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
            {categories.map((cat) => (
              <option key={cat} value={cat} />
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
            onChange={(e) => setName(e.target.value)}
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

        <div className="flex gap-3">
          <div className="flex-1">
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
              onChange={(e) => setDefaultScore(e.target.value)}
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
          <div className="flex-1">
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
              onChange={(e) => setDisplayOrder(e.target.value)}
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
          {isSubmitting && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
          {mode === 'create' ? '추가' : '저장'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
