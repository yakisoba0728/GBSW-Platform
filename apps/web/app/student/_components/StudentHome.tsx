'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/app/components/mileage/shared'
import { ListSkeleton, StatCardSkeleton } from '@/app/components/ui/list'
import {
  PageHeaderSkeleton,
  QuickLinksSkeleton,
  SummaryBarSkeleton,
} from '@/app/components/ui/page-skeletons'
import type {
  SchoolMileageHistoryItem,
  StudentMileageSummary,
} from '@/app/components/student/student-mileage-types'
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    const controller = new AbortController()

    async function fetchData() {
      setLoading(true)
      setError(null)

      try {
        const [summaryRes, entriesRes] = await Promise.all([
          fetch('/api/student/school-mileage/summary', {
            cache: 'no-store',
            signal: controller.signal,
          }).then((response) => {
            if (!response.ok) {
              throw new Error('요약 데이터를 불러오지 못했습니다.')
            }

            return response.json()
          }),
          fetch('/api/student/school-mileage/entries?pageSize=5', {
            cache: 'no-store',
            signal: controller.signal,
          }).then((response) => {
            if (!response.ok) {
              throw new Error('상벌점 내역을 불러오지 못했습니다.')
            }

            return response.json()
          }),
        ])

        if (!controller.signal.aborted) {
          setSummary(summaryRes.summary ?? null)
          setEntries(Array.isArray(entriesRes.items) ? entriesRes.items : [])
        }
      } catch (err: unknown) {
        if (controller.signal.aborted) {
          return
        }

        setError(
          err instanceof Error
            ? err.message
            : '데이터를 불러오는 중 오류가 발생했습니다.',
        )
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    void fetchData()

    return () => {
      controller.abort()
    }
  }, [retryKey])

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
            {error}
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
      </div>
    )
  }

  if (loading) {
    return (
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
    )
  }

  const rewardTotal = summary?.rewardTotal ?? 0
  const penaltyTotal = summary?.penaltyTotal ?? 0
  const netScore = summary?.netScore ?? 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
    </div>
  )
}
