'use client'

import { motion } from 'framer-motion'

function InfoCard({
  icon,
  title,
  description,
  delay,
}: {
  icon: React.ReactNode
  title: string
  description: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut', delay }}
      style={{
        borderRadius: 12,
        border: '1px solid var(--border)',
        backgroundColor: 'var(--bg-subtle)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
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
      <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--fg)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
        {title}
      </p>
      <p style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--fg-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
        {description}
      </p>
    </motion.div>
  )
}

export default function StudentHome() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
        <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8 }}>
          Student Dashboard
        </p>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--fg)', fontFamily: 'var(--font-noto-sans-kr), sans-serif', lineHeight: 1.3, letterSpacing: '-0.02em' }}>
          학생 대시보드에 오신 것을 환영합니다
        </h1>
        <p style={{ marginTop: 6, fontSize: 13, lineHeight: 1.6, color: 'var(--fg-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
          상벌점 내역을 조회하고 학교 생활 정보를 확인하세요.
        </p>
      </motion.div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        <InfoCard
          delay={0.06}
          title="상벌점 내역"
          description="부여받은 상점과 벌점 내역을 날짜별로 확인할 수 있습니다."
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
          }
        />
        <InfoCard
          delay={0.1}
          title="규정 항목"
          description="학교에 등록된 상벌점 규정 항목과 기준 점수를 확인할 수 있습니다."
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
            </svg>
          }
        />
        <InfoCard
          delay={0.14}
          title="학교 정보"
          description="경북소프트웨어마이스터고 및 봉양중학교의 학교 생활 정보를 제공합니다."
          icon={
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          }
        />
      </div>
    </div>
  )
}
