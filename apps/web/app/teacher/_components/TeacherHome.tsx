'use client'

import { motion } from 'framer-motion'
import { NoticeBox } from '@/app/components/mileage/shared'
import { RefetchWrapper } from '@/app/components/ui/primitives'
import { useLoadingGate } from '@/app/components/ui/useLoadingGate'
import { useRulesContext } from '@/app/components/mileage/rules-context'
import { StatsGridSkeleton } from '@/app/components/ui/page-skeletons'
import {
  getSectionMotion,
  getStaggerDelay,
  useMotionPreference,
} from '@/app/components/ui/motion'

function StatCard({
  label,
  value,
  color,
  isLoading,
  step,
}: {
  label: string
  value: number | string
  color?: string
  isLoading: boolean
  step: number
}) {
  const prefersReducedMotion = useMotionPreference()
  const motionProps = getSectionMotion(prefersReducedMotion, getStaggerDelay(step))

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
      <p style={{ fontSize: 11, color: 'var(--fg-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
        {label}
      </p>
      <p
        style={{
          marginTop: 8,
          fontSize: 30,
          fontWeight: 600,
          lineHeight: 1,
          minHeight: 30,
          fontFamily: 'var(--font-space-grotesk)',
          color: color ?? 'var(--fg)',
          transition: 'color 0.2s',
        }}
      >
        {isLoading ? (
          <span
            className="relative inline-block overflow-hidden"
            style={{
              width: '100%',
              maxWidth: 84,
              height: 30,
              borderRadius: 6,
              backgroundColor: 'var(--bg-muted)',
              verticalAlign: 'bottom',
            }}
          >
            <span
              className="absolute inset-0 animate-shimmer"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)',
              }}
            />
          </span>
        ) : (
          value
        )}
      </p>
    </motion.div>
  )
}

export default function TeacherHome() {
  const prefersReducedMotion = useMotionPreference()
  const sectionMotion = getSectionMotion(prefersReducedMotion)
  const { rules, isRulesLoading, rulesError } = useRulesContext()
  const hasRulesSnapshot = rules.length > 0 || Boolean(rulesError)
  const showLoading = useLoadingGate({ active: isRulesLoading && !hasRulesSnapshot })

  const rewardRules = rules.filter((rule) => rule.type === 'reward').length
  const penaltyRules = rules.filter((rule) => rule.type === 'penalty').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {rulesError && (
        <NoticeBox type="error" message={rulesError} />
      )}

      {!rulesError && (
        <>
          <motion.div
            initial={sectionMotion.initial}
            animate={sectionMotion.animate}
            transition={sectionMotion.transition}
            style={{
              borderRadius: 12,
              border: '1px solid var(--border)',
              backgroundColor: 'var(--bg-subtle)',
              padding: '20px',
            }}
          >
            <p style={{ fontSize: 16, fontWeight: 600, fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--fg)' }}>
              학교 상벌점 관리
            </p>
            <p style={{ marginTop: 6, fontSize: 13, lineHeight: 1.6, maxWidth: 600, fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--fg-muted)' }}>
              교사 화면에서는 학생에게 상점과 벌점을 부여하고, 이미 저장된 학교 상벌점 내역을 검색해 수정하거나 삭제할 수 있습니다.
            </p>
          </motion.div>

          {showLoading ? (
            <StatsGridSkeleton count={3} />
          ) : (
            <RefetchWrapper
              isFetching={isRulesLoading && hasRulesSnapshot}
              isInitialLoad={showLoading}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: 12,
                }}
              >
                <StatCard
                  label="활성 규칙 수"
                  value={rules.length}
                  isLoading={false}
                  step={1}
                />
                <StatCard
                  label="상점 규칙"
                  value={rewardRules}
                  color="var(--reward)"
                  isLoading={false}
                  step={2}
                />
                <StatCard
                  label="벌점 규칙"
                  value={penaltyRules}
                  color="var(--penalty)"
                  isLoading={false}
                  step={3}
                />
              </div>
            </RefetchWrapper>
          )}
        </>
      )}
    </div>
  )
}
