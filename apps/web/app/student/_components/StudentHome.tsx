'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/app/components/ui/card'
import { ListSkeleton, StatCardSkeleton } from '@/app/components/ui/list'
import {
  PageHeaderSkeleton,
  QuickLinksSkeleton,
  SummaryBarSkeleton,
} from '@/app/components/ui/page-skeletons'
import { MileageBadge, RefetchWrapper } from '@/app/components/ui/primitives'
import { useLoadingGate } from '@/app/components/ui/useLoadingGate'
import type {
  SchoolMileageHistoryItem,
  StudentMileageSummary,
} from '@/app/components/student/student-mileage-types'
import type {
  StudentDormMileageHistoryItem,
  StudentDormMileageSummary,
} from '@/app/components/student/student-dorm-mileage-types'
import {
  StudentHomeHeaderSection,
  StudentHomeQuickLinksSection,
  StudentHomeRecentEntriesSection,
  StudentHomeStatsSection,
  StudentHomeSummarySection,
} from './student-home-sections'

export default function StudentHome() {
  const [summary, setSummary] = useState<StudentMileageSummary | null>(null)
  const [entries, setEntries] = useState<SchoolMileageHistoryItem[]>([])
  const [dormSummary, setDormSummary] = useState<StudentDormMileageSummary | null>(null)
  const [dormEntries, setDormEntries] = useState<StudentDormMileageHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  const showLoading = useLoadingGate({ active: loading && !hasLoadedOnce })
  const [schoolError, setSchoolError] = useState<string | null>(null)
  const [dormError, setDormError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function fetchData() {
      setLoading(true)
      setSchoolError(null)
      setDormError(null)

      // Fetch school and dorm data independently so one failure doesn't hide the other
      const [schoolResult, dormResult] = await Promise.allSettled([
        Promise.all([
          fetch('/api/student/school-mileage/summary', {
            cache: 'no-store',
            signal: controller.signal,
          }).then((response) => {
            if (!response.ok) throw new Error('요약 데이터를 불러오지 못했습니다.')
            return response.json()
          }),
          fetch('/api/student/school-mileage/entries?pageSize=5', {
            cache: 'no-store',
            signal: controller.signal,
          }).then((response) => {
            if (!response.ok) throw new Error('상벌점 내역을 불러오지 못했습니다.')
            return response.json()
          }),
        ]),
        Promise.all([
          fetch('/api/student/dorm-mileage/summary', {
            cache: 'no-store',
            signal: controller.signal,
          })
            .then((response) => (response.ok ? response.json() : null))
            .catch(() => null),
          fetch('/api/student/dorm-mileage/entries?pageSize=5', {
            cache: 'no-store',
            signal: controller.signal,
          })
            .then((response) => (response.ok ? response.json() : null))
            .catch(() => null),
        ]),
      ])

      if (controller.signal.aborted) return

      let didLoadSuccessfully = false

      if (schoolResult.status === 'fulfilled') {
        const [summaryRes, entriesRes] = schoolResult.value
        setSummary(summaryRes.summary ?? null)
        setEntries(Array.isArray(entriesRes.items) ? entriesRes.items : [])
        didLoadSuccessfully = true
      } else {
        setSchoolError(
          schoolResult.reason instanceof Error
            ? schoolResult.reason.message
            : '데이터를 불러오는 중 오류가 발생했습니다.',
        )
      }

      if (dormResult.status === 'fulfilled') {
        const [dormSummaryRes, dormEntriesRes] = dormResult.value
        setDormSummary(dormSummaryRes?.summary ?? null)
        setDormEntries(Array.isArray(dormEntriesRes?.items) ? dormEntriesRes.items : [])
      } else {
        setDormError(
          dormResult.reason instanceof Error
            ? dormResult.reason.message
            : '기숙사 데이터를 불러오는 중 오류가 발생했습니다.',
        )
      }

      setLoading(false)
      if (didLoadSuccessfully) setHasLoadedOnce(true)
    }

    void fetchData()

    return () => {
      controller.abort()
    }
  }, [retryKey])

  const rewardTotal = summary?.rewardTotal ?? 0
  const penaltyTotal = summary?.penaltyTotal ?? 0
  const netScore = summary?.netScore ?? 0

  return (
    <>
      {showLoading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <PageHeaderSkeleton />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
          <SummaryBarSkeleton />
          <Card>
            <div className="mb-4">
              <div
                className="relative overflow-hidden rounded-md"
                style={{ height: 14, width: '32%', backgroundColor: 'var(--border)' }}
              >
                <div
                  className="absolute inset-0 animate-shimmer"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)',
                  }}
                />
              </div>
            </div>
            <ListSkeleton count={5} />
          </Card>
          <QuickLinksSkeleton count={3} />
        </div>
      )}

      <RefetchWrapper
        isFetching={loading && hasLoadedOnce}
        isInitialLoad={showLoading}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {schoolError && (
        <div
          className="rounded-xl border px-5 py-5"
          style={{
            borderColor: 'var(--penalty)',
            backgroundColor: 'color-mix(in srgb, var(--penalty) 8%, transparent)',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: 13,
              color: 'var(--penalty)',
              fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              marginBottom: 12,
            }}
          >
            {schoolError}
          </p>
          <button
            type="button"
            onClick={() => setRetryKey((key) => key + 1)}
            style={{
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              color: 'var(--accent)',
              backgroundColor: 'transparent',
              border: '1px solid var(--accent)',
              borderRadius: 8,
              padding: '6px 16px',
              cursor: 'pointer',
            }}
          >
            다시 시도
          </button>
        </div>
      )}
      {!schoolError && (
        <>
      <StudentHomeHeaderSection />
      <StudentHomeStatsSection
        rewardTotal={rewardTotal}
        penaltyTotal={penaltyTotal}
        netScore={netScore}
      />
      <StudentHomeSummarySection
        rewardTotal={rewardTotal}
        penaltyTotal={penaltyTotal}
      />
      <StudentHomeRecentEntriesSection entries={entries} />
      <StudentHomeQuickLinksSection />
        </>
      )}

      {dormError && (
        <div
          className="rounded-xl border px-5 py-4"
          style={{
            borderColor: 'var(--penalty)',
            backgroundColor: 'color-mix(in srgb, var(--penalty) 8%, transparent)',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              fontSize: 13,
              color: 'var(--penalty)',
              fontFamily: 'var(--font-noto-sans-kr), sans-serif',
            }}
          >
            {dormError}
          </p>
        </div>
      )}

      {!dormError && dormSummary && (
        <>
          <div
            style={{
              borderRadius: 12,
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg-subtle)',
              padding: '20px',
            }}
          >
            <p
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--accent)',
                marginBottom: 8,
                fontFamily: 'var(--font-space-grotesk)',
              }}
            >
              Dormitory
            </p>
            <h2
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: 'var(--fg)',
                fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                lineHeight: 1.3,
                letterSpacing: '-0.02em',
              }}
            >
              기숙사 상벌점
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {[
              {
                label: '상점 합계',
                value: `+${dormSummary.rewardTotal}`,
                subValue: '기숙사 상점',
                colorToken: 'green' as const,
              },
              {
                label: '벌점 합계',
                value: `-${dormSummary.penaltyTotal}`,
                subValue: '기숙사 벌점',
                colorToken: 'red' as const,
              },
              {
                label: '순점수',
                value: dormSummary.netScore,
                subValue: '상점 - 벌점',
                colorToken: 'default' as const,
              },
            ].map((card) => (
              <div
                key={card.label}
                style={{
                  borderRadius: 12,
                  border: '1px solid var(--border)',
                  backgroundColor: 'var(--bg-subtle)',
                  padding: '16px 20px',
                }}
              >
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: 'var(--fg-muted)',
                    fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                    marginBottom: 6,
                  }}
                >
                  {card.label}
                </p>
                <p
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    fontFamily: 'var(--font-space-grotesk)',
                    color:
                      card.colorToken === 'green'
                        ? 'var(--reward)'
                        : card.colorToken === 'red'
                          ? 'var(--penalty)'
                          : 'var(--fg)',
                    lineHeight: 1.2,
                  }}
                >
                  {card.value}
                </p>
                <p
                  style={{
                    fontSize: 11,
                    color: 'var(--fg-muted)',
                    fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                    marginTop: 4,
                  }}
                >
                  {card.subValue}
                </p>
              </div>
            ))}
          </div>

          {dormEntries.length > 0 && (
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <h2
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: 'var(--fg)',
                    fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                  }}
                >
                  최근 기숙사 상벌점 내역
                </h2>
                <Link
                  href="/student/dorm-mileage/history"
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: 'var(--accent)',
                    textDecoration: 'none',
                    fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                  }}
                >
                  전체 보기 &rarr;
                </Link>
              </div>

              <div className="hidden md:block">
                <table className="w-full" style={{ borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['일자', '구분', '규정', '분류', '점수'].map((h) => (
                        <th
                          key={h}
                          className="pb-2 text-left text-[11px] font-medium uppercase tracking-wider"
                          style={{
                            color: 'var(--fg-muted)',
                            fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dormEntries.map((entry) => {
                      const date = new Date(entry.awardedAt).toLocaleDateString('ko-KR', {
                        year: '2-digit',
                        month: '2-digit',
                        day: '2-digit',
                      })
                      return (
                        <tr
                          key={entry.id}
                          style={{ borderBottom: '1px solid var(--border)' }}
                          className="transition-colors hover:bg-black/[0.02]"
                        >
                          <td
                            className="py-2.5 text-xs"
                            style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--fg-muted)' }}
                          >
                            {date}
                          </td>
                          <td className="py-2.5">
                            <MileageBadge type={entry.type} score={entry.score} />
                          </td>
                          <td
                            className="py-2.5 text-xs"
                            style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--fg)' }}
                          >
                            {entry.ruleName}
                          </td>
                          <td
                            className="py-2.5 text-xs"
                            style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--fg-muted)' }}
                          >
                            {entry.ruleCategory}
                          </td>
                          <td
                            className="py-2.5 text-xs font-medium"
                            style={{
                              fontFamily: 'var(--font-space-grotesk)',
                              color: entry.type === 'reward' ? 'var(--reward)' : 'var(--penalty)',
                            }}
                          >
                            {entry.type === 'reward' ? '+' : '-'}
                            {entry.score}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col gap-2 md:hidden">
                {dormEntries.map((entry) => {
                  const date = new Date(entry.awardedAt).toLocaleDateString('ko-KR', {
                    year: '2-digit',
                    month: '2-digit',
                    day: '2-digit',
                  })
                  const borderColor =
                    entry.type === 'reward' ? 'var(--reward)' : 'var(--penalty)'

                  return (
                    <div
                      key={entry.id}
                      style={{
                        borderRadius: 10,
                        border: '1px solid var(--border)',
                        borderLeft: `3px solid ${borderColor}`,
                        padding: '12px 14px',
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          style={{
                            fontSize: 11,
                            color: 'var(--fg-muted)',
                            fontFamily: 'var(--font-space-grotesk)',
                          }}
                        >
                          {date}
                        </span>
                        <MileageBadge type={entry.type} score={entry.score} />
                      </div>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 500,
                          color: 'var(--fg)',
                          fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                          marginTop: 6,
                        }}
                      >
                        {entry.ruleName}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span
                          style={{
                            fontSize: 11,
                            color: 'var(--fg-muted)',
                            fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                          }}
                        >
                          {entry.ruleCategory}
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            fontFamily: 'var(--font-space-grotesk)',
                            color: entry.type === 'reward' ? 'var(--reward)' : 'var(--penalty)',
                          }}
                        >
                          {entry.type === 'reward' ? '+' : '-'}
                          {entry.score}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}
        </>
      )}
        </div>
      </RefetchWrapper>
    </>
  )
}
