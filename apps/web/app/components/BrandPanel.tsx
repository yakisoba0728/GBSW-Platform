import Image from 'next/image'

export default function BrandPanel() {
  return (
    <div
      className="relative hidden md:flex flex-col justify-between w-[36%] min-h-screen overflow-hidden px-12 py-10 transition-colors duration-300"
      style={{ background: 'var(--panel-bg)' }}
    >
      {/* Dot-grid texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(var(--panel-dot) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          maskImage: 'radial-gradient(ellipse 70% 70% at 40% 50%, black 30%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 40% 50%, black 30%, transparent 100%)',
        }}
      />

      {/* Right-edge fade */}
      <div
        className="absolute right-0 top-0 h-full w-28 pointer-events-none z-20"
        style={{ background: 'linear-gradient(to right, transparent, var(--panel-edge))' }}
      />

      {/* ── Top wordmark ── */}
      <div className="relative z-10 flex items-center gap-2.5">
        <Image
          src="/gbsw-logo.png"
          alt=""
          width={22}
          height={22}
          aria-hidden="true"
          style={{ opacity: 'var(--panel-logo-opacity)' }}
        />
        <span
          className="text-xs font-medium transition-colors duration-300"
          style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--panel-wordmark)' }}
        >
          GBSW Platform
        </span>
      </div>

      {/* ── Center ── */}
      <div className="relative z-10 flex flex-col gap-8 my-auto">

        {/* Logo */}
        <div className="relative w-fit">
          <Image
            src="/gbsw-logo.png"
            alt="경북소프트웨어마이스터고등학교 로고"
            width={80}
            height={80}
            priority
            style={{
              opacity: 'var(--panel-logo-opacity)',
              filter: 'brightness(var(--panel-logo-brightness))',
            }}
          />
        </div>

        {/* Text block */}
        <div className="space-y-3">
          <p
            className="text-[11px] transition-colors duration-300"
            style={{
              fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              color: 'var(--panel-text-muted)',
            }}
          >
            경북소프트웨어마이스터고등학교 · 봉양중학교
          </p>

          <h1
            className="leading-[1.08] transition-colors duration-300"
            style={{
              fontFamily: 'var(--font-black-han-sans), var(--font-noto-sans-kr), sans-serif',
              fontSize: 'clamp(2.1rem, 3.6vw, 3.2rem)',
              color: 'var(--panel-text)',
            }}
          >
            학교 생활의<br />
            모든 것을<br />
            <span
              style={{
                background: 'linear-gradient(95deg, #818cf8 0%, #6366f1 55%, #4338ca 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              한 곳에.
            </span>
          </h1>
        </div>
      </div>

      {/* ── Bottom copyright ── */}
      <div className="relative z-10 space-y-0.5">
        <p
          className="text-[11px] transition-colors duration-300"
          style={{
            fontFamily: 'var(--font-noto-sans-kr), sans-serif',
            color: 'var(--panel-text-sub)',
          }}
        >
          ⓒ 2026. 경북소프트웨어마이스터고등학교 All Rights Reserved.
        </p>
        <p
          className="mt-1 text-xs"
          style={{
            fontFamily: 'var(--font-noto-sans-kr), sans-serif',
            color: 'var(--panel-text-sub)',
            opacity: 0.5,
          }}
        >
          Made by <span style={{ opacity: 0.85 }}>김동혁</span>
        </p>
      </div>
    </div>
  )
}
