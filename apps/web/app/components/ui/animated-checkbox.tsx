'use client'

import { motion } from 'framer-motion'

interface AnimatedCheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  size?: number
}

const checkVariants = {
  unchecked: { pathLength: 0, opacity: 0 },
  checked: { pathLength: 1, opacity: 1 },
}

export default function AnimatedCheckbox({
  checked,
  onChange,
  disabled = false,
  size = 20,
}: AnimatedCheckboxProps) {
  return (
    <motion.button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      whileTap={disabled ? undefined : { scale: 0.85 }}
      style={{
        width: size,
        height: size,
        borderRadius: 6,
        border: checked ? 'none' : '2px solid var(--border)',
        backgroundColor: checked ? 'var(--accent)' : 'transparent',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        padding: 0,
        transition: 'background-color 0.15s ease, border-color 0.15s ease',
      }}
      animate={{
        scale: checked ? [1, 1.15, 1] : 1,
        backgroundColor: checked ? 'var(--accent)' : 'transparent',
      }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      aria-checked={checked}
      role="checkbox"
    >
      <svg
        width={size * 0.6}
        height={size * 0.6}
        viewBox="0 0 12 12"
        fill="none"
        style={{ display: 'block' }}
      >
        <motion.path
          d="M2.5 6.5L5 9L9.5 3.5"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={checkVariants}
          initial={false}
          animate={checked ? 'checked' : 'unchecked'}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        />
      </svg>
    </motion.button>
  )
}
