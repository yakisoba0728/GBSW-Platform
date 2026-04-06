'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/app/components/teacher/teacher-shared'
import { AnimatedListItem, ListEmptyState, ListSkeleton } from '@/app/components/ui/list'
import { MileageBadge } from '@/app/components/ui/primitives'
import { SearchIcon } from '@/app/components/ui/icons'
import { koreanIncludes } from '@/lib/korean-search'
import type { SchoolMileageRuleSummary, MileageType } from './student-mileage-types'

/* -- 탭 정의 -- */

const TABS: Array<{ key: MileageType; label: string }> = [
  { key: 'reward', label: '상점 규정' },
  { key: 'penalty', label: '벌점 규정' },
]

/* -- 컴포넌트 -- */

export default function StudentMileageRules() {
  const [rules, setRules] = useState<SchoolMileageRuleSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<MileageType>('reward')
  const [search, setSearch] = useState('')

  /* -- 데이터 로드 -- */

  useEffect(() => {
    const abortController = new AbortController()

    async function fetchRules() {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/student/school-mileage/rules', {
          cache: 'no-store',
          signal: abortController.signal,
        })
        const result = await response.json().catch(() => null)

        if (!response.ok) {
          setError(result?.message ?? '규정 목록을 불러오지 못했습니다.')
          return
        }

        setRules(
          Array.isArray(result?.rules) ? (result.rules as SchoolMileageRuleSummary[]) : [],
        )
      } catch {
        if (abortController.signal.aborted) return
        setError('규정 목록 조회 중 문제가 발생했습니다.')
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void fetchRules()

    return () => {
      abortController.abort()
    }
  }, [])

  /* -- 필터링 & 그룹핑 -- */

  const grouped = useMemo(() => {
    const filtered = rules
      .filter((r) => r.isActive && r.type === activeTab)
      .filter((r) => {
        if (!search.trim()) return true
        return koreanIncludes(r.name, search) || koreanIncludes(r.category, search)
      })

    const map = new Map<string, SchoolMileageRuleSummary[]>()
    for (const rule of filtered) {
      const list = map.get(rule.category) ?? []
      list.push(rule)
      map.set(rule.category, list)
    }

    return Array.from(map.entries()).map(([category, items]) => ({
      category,
      items: items.sort((a, b) => a.displayOrder - b.displayOrder),
    }))
  }, [rules, activeTab, search])

  /* -- 렌더 -- */

  return (
    <div className="flex h-full flex-col gap-3">
      {/* 탭 바 */}
      <Card>
        <div
          className="flex"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className="relative px-4 pb-2.5 pt-1 text-xs font-medium transition-colors"
                style={{
                  fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                  color: isActive ? 'var(--accent)' : 'var(--fg-muted)',
                  fontWeight: isActive ? 700 : 500,
                }}
              >
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="rule-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-[2px]"
                    style={{ backgroundColor: 'var(--accent)' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </Card>

      {/* 검색 + 규정 목록 */}
      <Card className="flex flex-1 flex-col min-h-0 overflow-hidden">
        {/* 검색 바 */}
        <div className="mb-3 flex items-center gap-2">
          <div
            className="flex h-9 flex-1 items-center gap-2 rounded-lg border px-3"
            style={{
              backgroundColor: 'var(--bg-subtle)',
              borderColor: 'var(--border)',
            }}
          >
            <SearchIcon
              size={13}
              style={{ color: 'var(--fg-muted)', flexShrink: 0 }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="항목명 또는 카테고리 검색..."
              className="h-full min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-[var(--fg-muted)]"
              style={{
                fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                color: 'var(--fg)',
              }}
            />
          </div>
        </div>

        {/* 규정 리스트 */}
        <div className="min-h-0 flex-1 overflow-y-auto pr-0.5">
          {isLoading ? (
            <ListSkeleton count={8} />
          ) : error ? (
            <div
              className="rounded-lg border px-4 py-3 text-xs"
              style={{
                borderColor: 'var(--penalty)',
                backgroundColor: 'color-mix(in srgb, var(--penalty) 8%, transparent)',
                color: 'var(--penalty)',
                fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              }}
            >
              {error}
            </div>
          ) : grouped.length === 0 ? (
            <ListEmptyState
              fill
              icon={
                <SearchIcon
                  size={20}
                  strokeWidth={1.5}
                  style={{ color: 'var(--accent)' }}
                />
              }
              title="검색 결과가 없습니다"
            />
          ) : (
            <div className="space-y-5">
              {grouped.map((group, groupIndex) => (
                <AnimatedListItem key={group.category} index={groupIndex}>
                  {/* 카테고리 헤더 */}
                  <p
                    className="mb-2 text-[11px] font-semibold uppercase tracking-wider"
                    style={{
                      color: 'var(--fg-muted)',
                      fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                    }}
                  >
                    {group.category}
                  </p>

                  {/* 규정 항목 */}
                  <div
                    className="rounded-xl border"
                    style={{
                      borderRadius: 12,
                      border: '1px solid var(--border)',
                      backgroundColor: 'var(--bg-subtle)',
                    }}
                  >
                    {group.items.map((rule, ruleIndex) => (
                      <div
                        key={rule.id}
                        className="flex items-center justify-between px-4 py-2.5"
                        style={{
                          borderBottom:
                            ruleIndex < group.items.length - 1
                              ? '1px solid var(--border)'
                              : 'none',
                        }}
                      >
                        <span
                          className="min-w-0 flex-1 truncate text-xs font-medium"
                          style={{
                            color: 'var(--fg)',
                            fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                          }}
                        >
                          {rule.name}
                        </span>
                        <MileageBadge
                          type={rule.type}
                          score={rule.defaultScore}
                          className="ml-3 flex-shrink-0"
                        />
                      </div>
                    ))}
                  </div>
                </AnimatedListItem>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
