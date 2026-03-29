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

      {/* Ambient glow — top */}
      <div
        className="absolute -top-40 -left-20 w-[420px] h-[420px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--panel-glow-top) 0%, transparent 68%)' }}
      />
      {/* Ambient glow — bottom */}
      <div
        className="absolute -bottom-28 -right-10 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, var(--panel-glow-bottom) 0%, transparent 70%)' }}
      />

      {/* Atmospheric SVG */}
      <div
        className="absolute bottom-12 right-4 pointer-events-none select-none z-0"
        style={{ opacity: 'var(--panel-atmo-opacity)', color: 'var(--panel-text-muted)' }}
        aria-hidden="true"
      >
        <AtmosphericSVG />
      </div>

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
          <div
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: 'radial-gradient(circle, rgba(129,140,248,0.2) 0%, transparent 70%)',
              transform: 'scale(1.8)',
            }}
            aria-hidden="true"
          />
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
      </div>
    </div>
  )
}

function AtmosphericSVG() {
  return (
    <svg width="260" height="260" viewBox="0 0 260 260" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="130" cy="130" r="120" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 7"/>
      <circle cx="130" cy="130" r="88"  stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 6"/>
      <circle cx="130" cy="130" r="56"  stroke="currentColor" strokeWidth="0.8" strokeDasharray="2 5"/>
      <circle cx="130" cy="130" r="24"  stroke="currentColor" strokeWidth="1"/>
      <line x1="130" y1="10"  x2="130" y2="250" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 8"/>
      <line x1="10"  y1="130" x2="250" y2="130" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 8"/>
      <circle cx="130" cy="42"  r="3" fill="currentColor"/>
      <circle cx="218" cy="130" r="3" fill="currentColor"/>
      <circle cx="130" cy="218" r="3" fill="currentColor"/>
      <circle cx="42"  cy="130" r="3" fill="currentColor"/>
      <circle cx="130" cy="130" r="5" fill="currentColor"/>
    </svg>
  )
}
