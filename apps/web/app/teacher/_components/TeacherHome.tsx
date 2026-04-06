'use client'

import { motion } from 'framer-motion'
import { NoticeBox } from '@/app/components/teacher/teacher-shared'
import { useRulesContext } from './RulesContext'

const stagger = {
  container: { transition: { staggerChildren: 0.06 } },
  item: { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.25, ease: 'easeOut' } },
}

function StatCard({
  label,
  value,
  color,
  isLoading,
}: {
  label: string
  value: number | string
  color?: string
  isLoading: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
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
          <span style={{ display: 'inline-block', width: 48, height: 30, borderRadius: 6, backgroundColor: 'var(--bg-muted)', verticalAlign: 'bottom' }} />
        ) : (
          value
        )}
      </p>
    </motion.div>
  )
}

export default function TeacherHome() {
  const { rules, isRulesLoading, rulesError } = useRulesContext()

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
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
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

          <motion.div
            {...stagger.container}
            animate="animate"
            initial="initial"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}
          >
            <StatCard label="활성 규칙 수" value={rules.length} isLoading={isRulesLoading} />
            <StatCard label="상점 규칙" value={rewardRules} color="var(--reward)" isLoading={isRulesLoading} />
            <StatCard label="벌점 규칙" value={penaltyRules} color="var(--penalty)" isLoading={isRulesLoading} />
          </motion.div>
        </>
      )}
    </div>
  )
}
