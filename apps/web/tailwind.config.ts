import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#ffffff',
          'bg-subtle': '#f5f5f5',
          'bg-muted': '#ebebeb',
          border: '#e0e0e0',
          fg: '#111111',
          'fg-muted': '#666666',
          accent: '#1a56db',
          'accent-subtle': '#eff6ff',
          reward: '#16a34a',
          penalty: '#dc2626',
        },
      },
      fontFamily: {
        sans: ['Space Grotesk', 'Apple SD Gothic Neo', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'page-enter': 'pageEnter 0.25s ease forwards',
        shimmer: 'shimmer 2.5s linear infinite',
        'shimmer-slide': 'shimmerSlide 1.6s ease-in-out infinite',
      },
      keyframes: {
        pageEnter: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        shimmerSlide: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      transitionDuration: {
        '220': '220ms',
        '250': '250ms',
        '400': '400ms',
      },
      borderRadius: {
        'card': '12px',
      },
    },
  },
  plugins: [],
}

export default config
