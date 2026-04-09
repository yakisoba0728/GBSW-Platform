'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ModalBase } from '../ui/modal'
import { SearchIcon, XIcon } from '../ui/icons'
import { EmptyStatePane } from '../ui/list'
import { inputStyle } from '../mileage/shared'
import { koreanIncludes } from '@/lib/korean-search'
import type { SharedMileageRuleSummary } from './shared-mileage-types'

type SharedRuleSelectionModalProps<Rule extends SharedMileageRuleSummary> = {
  isOpen: boolean
  rewardRules: Rule[]
  penaltyRules: Rule[]
  currentRuleId: number | ''
  onSelect: (rule: Rule, score: number) => void
  onClose: () => void
  title: string
  description: string
  allowScoreRange?: boolean
}

export default function SharedRuleSelectionModal<Rule extends SharedMileageRuleSummary>({
  isOpen,
  rewardRules,
  penaltyRules,
  currentRuleId,
  onSelect,
  onClose,
  title,
  description,
  allowScoreRange = false,
}: SharedRuleSelectionModalProps<Rule>) {
  const [search, setSearch] = useState('')
  const [scoreInputs, setScoreInputs] = useState<Record<number, string>>({})
  const searchRef = useRef<HTMLInputElement>(null)

  function handleClose() {
    setSearch('')
    setScoreInputs({})
    onClose()
  }

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const timeoutId = window.setTimeout(() => searchRef.current?.focus(), 80)
    return () => window.clearTimeout(timeoutId)
  }, [isOpen])

  const filteredReward = useMemo(
    () =>
      rewardRules.filter(
        (rule) =>
          !search ||
          koreanIncludes(rule.name, search) ||
          koreanIncludes(rule.category, search),
      ),
    [rewardRules, search],
  )

  const filteredPenalty = useMemo(
    () =>
      penaltyRules.filter(
        (rule) =>
          !search ||
          koreanIncludes(rule.name, search) ||
          koreanIncludes(rule.category, search),
      ),
    [penaltyRules, search],
  )

  const hasResults = filteredReward.length > 0 || filteredPenalty.length > 0

  function hasScoreRange(rule: Rule) {
    return (
      allowScoreRange &&
      rule.minScore !== null &&
      rule.minScore !== undefined &&
      rule.maxScore !== null &&
      rule.maxScore !== undefined
    )
  }

  function getScoreForRule(rule: Rule): number {
    if (hasScoreRange(rule)) {
      const input = scoreInputs[rule.id]
      if (input !== undefined && input !== '') {
        const parsed = Number(input)
        if (!Number.isNaN(parsed)) {
          return parsed
        }
      }
    }

    return rule.defaultScore
  }

  function handleSelectRule(rule: Rule) {
    onSelect(rule, getScoreForRule(rule))
    handleClose()
  }

  function renderRuleItem(rule: Rule) {
    const isSelected = currentRuleId === rule.id
    const isReward = rule.type === 'reward'
    const ranged = hasScoreRange(rule)

    return (
      <div
        key={rule.id}
        className="rounded-xl px-3 py-2.5 transition-colors"
        style={{
          backgroundColor: isSelected
            ? isReward
              ? 'rgba(34,197,94,0.08)'
              : 'rgba(239,68,68,0.08)'
            : 'transparent',
          borderWidth: 1,
          borderStyle: 'solid',
          borderColor: isSelected
            ? isReward
              ? 'rgba(34,197,94,0.3)'
              : 'rgba(239,68,68,0.3)'
            : 'transparent',
        }}
      >
        <button
          type="button"
          onClick={() => handleSelectRule(rule)}
          className="flex w-full items-center gap-3 text-left"
        >
          <span
            className="w-[52px] flex-shrink-0 rounded-md px-2 py-0.5 text-center text-xs font-bold"
            style={{
              backgroundColor: isReward
                ? 'rgba(34,197,94,0.15)'
                : 'rgba(239,68,68,0.15)',
              color: isReward ? '#15803d' : '#b91c1c',
              border: `1px solid ${isReward ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
              fontFamily: 'var(--font-space-grotesk)',
            }}
          >
            {isReward ? '+' : '-'}
            {rule.defaultScore}점
          </span>
          <div className="min-w-0 flex-1">
            <p
              className="truncate text-sm font-medium"
              style={{
                color: 'var(--admin-text)',
                fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              }}
            >
              {rule.name}
            </p>
            <p
              className="truncate text-[11px]"
              style={{
                color: 'var(--admin-text-muted)',
                fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              }}
            >
              {rule.category}
            </p>
          </div>
        </button>

        {ranged && (
          <div className="mt-2 flex items-center gap-2 pl-[64px]">
            <span
              className="text-xs"
              style={{
                fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                color: 'var(--admin-text-muted)',
              }}
            >
              점수:
            </span>
            <input
              type="number"
              min={rule.minScore ?? undefined}
              max={rule.maxScore ?? undefined}
              value={scoreInputs[rule.id] ?? rule.defaultScore}
              onChange={(event) =>
                setScoreInputs((prev) => ({ ...prev, [rule.id]: event.target.value }))
              }
              onClick={(event) => event.stopPropagation()}
              className="w-16 rounded-md border px-2 py-1 text-xs outline-none"
              style={inputStyle}
            />
            <span
              className="text-xs"
              style={{
                fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                color: 'var(--admin-text-muted)',
              }}
            >
              점 ({rule.minScore}~{rule.maxScore})
            </span>
          </div>
        )}
      </div>
    )
  }

  return (
    <ModalBase isOpen={isOpen} onClose={handleClose} maxWidth="max-w-lg">
      <div
        className="flex max-h-[80vh] flex-col overflow-hidden rounded-2xl border"
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
            <p
              className="mt-0.5 text-xs"
              style={{
                fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                color: 'var(--admin-text-muted)',
              }}
            >
              {description}
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
          className="px-5 py-3"
          style={{ borderBottom: '1px solid var(--admin-border)' }}
        >
          <div className="relative">
            <SearchIcon
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--admin-text-muted)' }}
            />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="항목명 또는 카테고리 검색"
              className="w-full rounded-lg border py-2 pl-8 pr-3 text-sm outline-none"
              style={inputStyle}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {!hasResults ? (
            <EmptyStatePane
              icon={
                <SearchIcon
                  size={24}
                  strokeWidth={1.5}
                  style={{ color: 'var(--admin-text-muted)' }}
                />
              }
              title="검색 결과가 없습니다."
              description="항목명이나 카테고리로 다시 검색해 보세요."
              className="min-h-[220px]"
            />
          ) : (
            <div className="space-y-4">
              {filteredReward.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center gap-1.5 px-1">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: '#16a34a' }}
                    />
                    <p
                      className="text-[11px] font-semibold tracking-wide"
                      style={{
                        color: '#16a34a',
                        fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                      }}
                    >
                      상점 ({filteredReward.length})
                    </p>
                  </div>
                  <div className="space-y-1">
                    {filteredReward.map((rule) => renderRuleItem(rule))}
                  </div>
                </div>
              )}

              {filteredPenalty.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center gap-1.5 px-1">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: '#dc2626' }}
                    />
                    <p
                      className="text-[11px] font-semibold tracking-wide"
                      style={{
                        color: '#dc2626',
                        fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                      }}
                    >
                      벌점 ({filteredPenalty.length})
                    </p>
                  </div>
                  <div className="space-y-1">
                    {filteredPenalty.map((rule) => renderRuleItem(rule))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ModalBase>
  )
}
