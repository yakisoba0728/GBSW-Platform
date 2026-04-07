'use client'

import { motion } from 'framer-motion'
import { CircleX } from 'lucide-react'

export default function DormAccessDenied({
  message = '사감 교사만 이 기능을 사용할 수 있습니다.',
}: {
  message?: string
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        gap: 12,
        padding: '32px 16px',
      }}
    >
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.05 }}
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          backgroundColor: 'rgba(239,68,68,0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.12 }}
        >
          <CircleX
            size={28}
            strokeWidth={1.8}
            style={{ color: 'rgba(239,68,68,0.8)' }}
          />
        </motion.div>
      </motion.div>

      <div style={{ textAlign: 'center' }}>
        <p
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--fg)',
            fontFamily: 'var(--font-noto-sans-kr), sans-serif',
            marginBottom: 4,
          }}
        >
          접근 권한 없음
        </p>
        <p
          style={{
            fontSize: 12,
            color: 'var(--fg-muted)',
            fontFamily: 'var(--font-noto-sans-kr), sans-serif',
          }}
        >
          {message}
        </p>
      </div>
    </div>
  )
}
