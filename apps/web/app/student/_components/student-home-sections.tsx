'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Card, StatCard, ScoreSummaryBar, formatAwardedAtParts } from '@/app/components/mileage/shared'
import { MileageBadge } from '@/app/components/ui/primitives'
import {
  getSectionMotion,
  getStaggerDelay,
  useMotionPreference,
} from '@/app/components/ui/motion'
import type { SchoolMileageHistoryItem } from '@/app/components/student/student-mileage-types'

function ClipboardIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  )
}

function FileTextIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  )
}

function ArrowRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  )
}

function QuickLinkCard({
  href,
  icon,
  title,
  description,
  step,
}: {
  href: string
  icon: React.ReactNode
  title: string
  description: string
  step: number
}) {
  const prefersReducedMotion = useMotionPreference()
  const motionProps = getSectionMotion(prefersReducedMotion, getStaggerDelay(step))

  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <motion.div
        initial={motionProps.initial}
        animate={motionProps.animate}
        transition={motionProps.transition}
        style={{
          borderRadius: 12,
          border: '1px solid var(--border)',
          backgroundColor: 'var(--bg-subtle)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          cursor: 'pointer',
        }}
        className="transition-shadow hover:shadow-md"
      >
        <div className="flex items-center justify-between">
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 8,
              backgroundColor: 'var(--accent-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent)',
            }}
          >
            {icon}
          </div>
          <div style={{ color: 'var(--fg-muted)' }}>
            <ArrowRightIcon />
          </div>
        </div>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
          {title}
        </p>
        <p style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--fg-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
          {description}
        </p>
      </motion.div>
    </Link>
  )
}

export function StudentHomeHeaderSection() {
  const prefersReducedMotion = useMotionPreference()
  const motionProps = getSectionMotion(prefersReducedMotion)

  return (
    <motion.div
      initial={motionProps.initial}
      animate={motionProps.animate}
      transition={motionProps.transition}
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
        Student Dashboard
      </p>
      <h1
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: 'var(--fg)',
          fontFamily: 'var(--font-noto-sans-kr), sans-serif',
          lineHeight: 1.3,
          letterSpacing: '-0.02em',
        }}
      >
        학생 대시보드
      </h1>
      <p
        style={{
          marginTop: 6,
          fontSize: 13,
          lineHeight: 1.6,
          color: 'var(--fg-muted)',
          fontFamily: 'var(--font-noto-sans-kr), sans-serif',
        }}
      >
        나의 상벌점 현황을 확인하세요.
      </p>
    </motion.div>
  )
}

export function StudentHomeStatsSection({
  rewardTotal,
  penaltyTotal,
  netScore,
}: {
  rewardTotal: number
  penaltyTotal: number
  netScore: number
}) {
  const prefersReducedMotion = useMotionPreference()

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {[
        {
          label: '총 상점',
          value: `+${rewardTotal}`,
          subValue: '상점 합계',
          colorToken: 'green' as const,
        },
        {
          label: '총 벌점',
          value: `-${penaltyTotal}`,
          subValue: '벌점 합계',
          colorToken: 'red' as const,
        },
        {
          label: '순점수',
          value: netScore,
          subValue: '상점 - 벌점',
          colorToken: 'default' as const,
        },
      ].map((card, index) => {
        const motionProps = getSectionMotion(
          prefersReducedMotion,
          getStaggerDelay(index + 1),
        )

        return (
          <motion.div
            key={card.label}
            initial={motionProps.initial}
            animate={motionProps.animate}
            transition={motionProps.transition}
          >
            <StatCard {...card} />
          </motion.div>
        )
      })}
    </div>
  )
}

export function StudentHomeSummarySection({
  rewardTotal,
  penaltyTotal,
}: {
  rewardTotal: number
  penaltyTotal: number
}) {
  const prefersReducedMotion = useMotionPreference()
  const motionProps = getSectionMotion(prefersReducedMotion, getStaggerDelay(4))

  if (rewardTotal <= 0 && penaltyTotal <= 0) {
    return null
  }

  return (
    <motion.div
      initial={motionProps.initial}
      animate={motionProps.animate}
      transition={motionProps.transition}
      style={{
        borderRadius: 12,
        border: '1px solid var(--border)',
        backgroundColor: 'var(--bg-subtle)',
        padding: '16px 20px',
      }}
    >
      <ScoreSummaryBar reward={rewardTotal} penalty={penaltyTotal} />
    </motion.div>
  )
}

export function StudentHomeRecentEntriesSection({
  entries,
}: {
  entries: SchoolMileageHistoryItem[]
}) {
  const prefersReducedMotion = useMotionPreference()
  const motionProps = getSectionMotion(prefersReducedMotion, getStaggerDelay(5))

  return (
    <motion.div
      initial={motionProps.initial}
      animate={motionProps.animate}
      transition={motionProps.transition}
    >
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
            최근 상벌점 내역
          </h2>
          <Link
            href="/student/mileage/history"
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

        {entries.length === 0 ? (
          <p
            style={{
              fontSize: 13,
              color: 'var(--fg-muted)',
              fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              textAlign: 'center',
              padding: '24px 0',
            }}
          >
            아직 상벌점 내역이 없습니다.
          </p>
        ) : (
          <>
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
                  {entries.map((entry) => {
                    const { date } = formatAwardedAtParts(entry.awardedAt)
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
              {entries.map((entry) => {
                const { date } = formatAwardedAtParts(entry.awardedAt)
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
          </>
        )}
      </Card>
    </motion.div>
  )
}

export function StudentHomeQuickLinksSection() {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <QuickLinkCard
        step={1}
        href="/student/mileage/history"
        icon={<ClipboardIcon />}
        title="상벌점 내역"
        description="부여받은 상점과 벌점 내역을 날짜별로 확인할 수 있습니다."
      />
      <QuickLinkCard
        step={2}
        href="/student/mileage/rules"
        icon={<FileTextIcon />}
        title="규정 항목"
        description="학교에 등록된 상벌점 규정 항목과 기준 점수를 확인할 수 있습니다."
      />
      <QuickLinkCard
        step={3}
        href="/student/mileage/stats"
        icon={<ChartIcon />}
        title="내 통계"
        description="나의 상벌점 통계와 추이를 시각적으로 확인할 수 있습니다."
      />
    </div>
  )
}
