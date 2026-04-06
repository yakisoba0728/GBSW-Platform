'use client'

import { useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

const Lottie = dynamic(() => import('lottie-react'), { ssr: false })

type SuccessModalType = 'success' | 'error' | 'warning'

interface SuccessModalProps {
  open: boolean
  onClose: () => void
  type: SuccessModalType
  title: string
  description?: string
  autoCloseMs?: number
}

const LOTTIE_SRC: Record<SuccessModalType, string> = {
  success: '/lottie/success.json',
  error: '/lottie/error.json',
  warning: '/lottie/error.json',
}

export default function SuccessModal({
  open,
  onClose,
  type,
  title,
  description,
  autoCloseMs = 3000,
}: SuccessModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <SuccessModalContent
          onClose={onClose}
          type={type}
          title={title}
          description={description}
          autoCloseMs={autoCloseMs}
        />
      )}
    </AnimatePresence>
  )
}

function SuccessModalContent({
  onClose,
  type,
  title,
  description,
  autoCloseMs = 3000,
}: Omit<SuccessModalProps, 'open'>) {
  const [animationData, setAnimationData] = useState<object | null>(null)
  const [textVisible, setTextVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    let isMounted = true

    fetch(LOTTIE_SRC[type])
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          setAnimationData(data)
        }
      })
      .catch(() => {
        if (isMounted) {
          setTextVisible(true)
        }
      })

    return () => {
      isMounted = false
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [type])

  useEffect(() => {
    if (!textVisible || autoCloseMs <= 0) return

    timerRef.current = setTimeout(onClose, autoCloseMs)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [textVisible, autoCloseMs, onClose])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1000,
          background: 'rgba(0,0,0,0.5)',
          backdropFilter: 'blur(2px)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.97 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1001,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          pointerEvents: 'none',
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            pointerEvents: 'auto',
            width: '100%',
            maxWidth: 360,
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            overflow: 'hidden',
            textAlign: 'center',
            position: 'relative',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--fg-muted)',
              padding: 4,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              zIndex: 1,
            }}
          >
            <X size={16} strokeWidth={2} aria-hidden="true" />
          </button>

          <div style={{ padding: '32px 24px 28px' }}>
            {animationData && (
              <div
                style={{
                  width: 100,
                  height: 100,
                  margin: '0 auto 16px',
                }}
              >
                <Lottie
                  animationData={animationData}
                  loop={false}
                  onComplete={() => setTextVisible(true)}
                  style={{ width: '100%', height: '100%' }}
                />
              </div>
            )}

            <motion.div
              initial={false}
              animate={{
                opacity: textVisible || !animationData ? 1 : 0,
                y: textVisible || !animationData ? 0 : 8,
              }}
              transition={{ duration: 0.3 }}
            >
              <p
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: 'var(--fg)',
                  fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                  margin: 0,
                }}
              >
                {title}
              </p>
              {description && (
                <p
                  style={{
                    fontSize: 13,
                    color: 'var(--fg-muted)',
                    fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                    marginTop: 6,
                    lineHeight: 1.5,
                  }}
                >
                  {description}
                </p>
              )}
            </motion.div>
          </div>
        </div>
      </motion.div>
    </>
  )
}
