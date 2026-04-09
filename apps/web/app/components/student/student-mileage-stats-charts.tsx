'use client'

import { motion } from 'framer-motion'
import { Card, SectionTitle } from '@/app/components/ui/card'
import {
  CHART_LANE_OFFSET,
  getChartRevealTransition,
  useMotionPreference,
} from '@/app/components/ui/motion'

export function CategoryBarChart({
  title,
  data,
  colorVar,
}: {
  title: string
  data: Array<{ category: string; total: number }>
  colorVar: string
}) {
  const prefersReducedMotion = useMotionPreference()

  if (data.length === 0) {
    return (
      <Card>
        <SectionTitle>{title}</SectionTitle>
        <p
          className="py-6 text-center text-xs"
          style={{
            color: 'var(--fg-muted)',
            fontFamily: 'var(--font-noto-sans-kr), sans-serif',
          }}
        >
          데이터가 없습니다.
        </p>
      </Card>
    )
  }

  const maxScore = Math.max(...data.map((d) => d.total))
  const totalScore = data.reduce((sum, d) => sum + d.total, 0)

  return (
    <Card>
      <SectionTitle>{title}</SectionTitle>
      <div className="space-y-2.5">
        {data.map((item, index) => {
          const pct = maxScore > 0 ? Math.round((item.total / maxScore) * 100) : 0
          const share = totalScore > 0 ? Math.round((item.total / totalScore) * 100) : 0

          return (
            <div key={item.category} className="flex items-center gap-3">
              <span
                className="text-[11px] font-medium"
                style={{
                  width: 80,
                  flexShrink: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  color: 'var(--fg-muted)',
                  fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                }}
                title={item.category}
              >
                {item.category}
              </span>
              <div className="flex-1" style={{ minWidth: 0 }}>
                <motion.div
                  initial={prefersReducedMotion ? { opacity: 0 } : { width: 0 }}
                  animate={prefersReducedMotion ? { opacity: 1 } : { width: `${pct}%` }}
                  transition={getChartRevealTransition(prefersReducedMotion, index)}
                  style={{
                    width: prefersReducedMotion ? `${pct}%` : undefined,
                    height: 20,
                    borderRadius: 4,
                    backgroundColor: colorVar,
                    minWidth: pct > 0 ? 4 : 0,
                  }}
                />
              </div>
              <span
                className="text-[12px] font-semibold"
                style={{
                  width: 80,
                  flexShrink: 0,
                  textAlign: 'right',
                  color: colorVar,
                  fontFamily: 'var(--font-space-grotesk)',
                }}
              >
                {item.total}
                <span
                  className="ml-1 text-[11px] font-normal"
                  style={{ color: 'var(--fg-muted)' }}
                >
                  ({share}%)
                </span>
              </span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

export function MonthlyTrendChart({
  data,
}: {
  data: Array<{ key: string; label: string; reward: number; penalty: number }>
}) {
  const prefersReducedMotion = useMotionPreference()

  if (data.length === 0) {
    return (
      <Card>
        <SectionTitle>월별 추이 (최근 6개월)</SectionTitle>
        <p
          className="py-6 text-center text-xs"
          style={{
            color: 'var(--fg-muted)',
            fontFamily: 'var(--font-noto-sans-kr), sans-serif',
          }}
        >
          데이터가 없습니다.
        </p>
      </Card>
    )
  }

  const maxTotal = Math.max(...data.map((d) => d.reward + d.penalty), 1)
  const yAxisMax = maxTotal
  const yAxisMid = Math.round(yAxisMax / 2)

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <SectionTitle>월별 추이 (최근 6개월)</SectionTitle>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span
              style={{
                display: 'inline-block',
                width: 10,
                height: 10,
                borderRadius: 2,
                backgroundColor: 'var(--reward)',
              }}
            />
            <span
              className="text-[11px]"
              style={{
                color: 'var(--fg-muted)',
                fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              }}
            >
              상점
            </span>
          </span>
          <span className="flex items-center gap-1.5">
            <span
              style={{
                display: 'inline-block',
                width: 10,
                height: 10,
                borderRadius: 2,
                backgroundColor: 'var(--penalty)',
              }}
            />
            <span
              className="text-[11px]"
              style={{
                color: 'var(--fg-muted)',
                fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              }}
            >
              벌점
            </span>
          </span>
        </div>
      </div>

      <div className="flex" style={{ height: 200 }}>
        <div
          className="flex flex-col justify-between pr-2"
          style={{ width: 36, flexShrink: 0 }}
        >
          {[yAxisMax, yAxisMid, 0].map((value) => (
            <span
              key={value}
              className="text-[11px]"
              style={{
                color: 'var(--fg-muted)',
                fontFamily: 'var(--font-space-grotesk)',
                lineHeight: 1,
              }}
            >
              {value}
            </span>
          ))}
        </div>

        <div className="flex flex-1 items-end gap-2">
          {data.map((month, index) => {
            const total = month.reward + month.penalty
            const rewardPct = maxTotal > 0 ? (month.reward / maxTotal) * 100 : 0
            const penaltyPct = maxTotal > 0 ? (month.penalty / maxTotal) * 100 : 0

            return (
              <div
                key={month.key}
                className="flex flex-1 flex-col items-center"
                style={{ minWidth: 0 }}
              >
                <div
                  className="flex w-full flex-col items-center justify-end"
                  style={{ height: 168, maxWidth: 40 }}
                >
                  {total > 0 && (
                    <div className="flex w-full flex-col">
                      {month.penalty > 0 && (
                        <motion.div
                          initial={prefersReducedMotion ? { opacity: 0 } : { height: 0 }}
                          animate={prefersReducedMotion ? { opacity: 1 } : { height: `${penaltyPct}%` }}
                          transition={getChartRevealTransition(prefersReducedMotion, index)}
                          style={{
                            height: prefersReducedMotion ? `${penaltyPct}%` : undefined,
                            width: '100%',
                            maxWidth: 40,
                            backgroundColor: 'var(--penalty)',
                            borderRadius: '4px 4px 0 0',
                            minHeight: 2,
                          }}
                        />
                      )}
                      {month.reward > 0 && (
                        <motion.div
                          initial={prefersReducedMotion ? { opacity: 0 } : { height: 0 }}
                          animate={prefersReducedMotion ? { opacity: 1 } : { height: `${rewardPct}%` }}
                          transition={getChartRevealTransition(prefersReducedMotion, index, CHART_LANE_OFFSET)}
                          style={{
                            height: prefersReducedMotion ? `${rewardPct}%` : undefined,
                            width: '100%',
                            maxWidth: 40,
                            backgroundColor: 'var(--reward)',
                            borderRadius: month.penalty > 0 ? '0 0 4px 4px' : '4px',
                            minHeight: 2,
                          }}
                        />
                      )}
                    </div>
                  )}
                </div>

                <span
                  className="mt-2 text-[11px]"
                  style={{
                    color: 'var(--fg-muted)',
                    fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                  }}
                >
                  {month.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
