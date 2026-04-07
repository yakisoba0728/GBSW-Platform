'use client'

import { motion } from 'framer-motion'
import { CircleX } from 'lucide-react'

export default function AccessDeniedOverlay({
  message = '접근 권한이 없습니다.',
}: {
  message?: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(6px)',
        backgroundColor: 'var(--overlay-bg)',
        borderRadius: 'inherit',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            backgroundColor: 'var(--destructive-bg, rgba(239,68,68,0.12))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
          >
            <CircleX size={28} style={{ color: 'var(--destructive, #ef4444)' }} />
          </motion.div>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.15 }}
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--fg-muted, var(--fg))',
            textAlign: 'center',
            maxWidth: 240,
          }}
        >
          {message}
        </motion.p>
      </div>
    </motion.div>
  )
}
