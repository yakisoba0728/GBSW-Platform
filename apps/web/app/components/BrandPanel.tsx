import Image from 'next/image'

export default function BrandPanel() {
  return (
    <div
      className="relative hidden lg:flex flex-col justify-between overflow-hidden px-12 py-10 transition-colors duration-300"
      style={{ width: '40%', minHeight: '100svh', background: 'var(--panel-bg)' }}
    >
      {/* 도트 그리드 텍스처 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(var(--panel-dot) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          maskImage: 'radial-gradient(ellipse 70% 70% at 40% 50%, black 30%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 70% 70% at 40% 50%, black 30%, transparent 100%)',
        }}
      />

      {/* 우측 엣지 페이드 */}
      <div
        className="absolute right-0 top-0 h-full w-28 pointer-events-none z-20"
        style={{ background: 'linear-gradient(to right, transparent, var(--panel-edge))' }}
      />

      {/* 워드마크 (상단) */}
      <div className="relative z-10 flex items-center gap-2.5">
        <Image
          src="/gbsw-logo.png"
          alt=""
          width={22}
          height={22}
          aria-hidden="true"
          style={{ opacity: 'var(--panel-logo-opacity)' as string }}
        />
        <span
          style={{
            fontFamily: 'var(--font-space-grotesk)',
            fontSize: 12,
            fontWeight: 500,
            color: 'var(--panel-wordmark)',
            transition: 'color 0.3s',
          }}
        >
          GBSW Platform
        </span>
      </div>

      {/* 중앙 콘텐츠 */}
      <div className="relative z-10 flex flex-col gap-8 my-auto">
        {/* 로고 */}
        <div className="relative w-fit">
          <Image
            src="/gbsw-logo.png"
            alt="경북소프트웨어마이스터고등학교 로고"
            width={76}
            height={76}
            priority
            style={{
              opacity: 'var(--panel-logo-opacity)' as string,
              filter: 'brightness(var(--panel-logo-brightness))',
            }}
          />
        </div>

        {/* 텍스트 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <p style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', fontSize: 11, color: 'var(--panel-text-muted)', transition: 'color 0.3s' }}>
            경북소프트웨어마이스터고등학교 · 봉양중학교
          </p>

          <h1
            style={{
              fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              fontSize: 'clamp(2rem, 3.2vw, 3rem)',
              fontWeight: 700,
              lineHeight: 1.1,
              color: 'var(--panel-text)',
              transition: 'color 0.3s',
              letterSpacing: '-0.02em',
            }}
          >
            학교 생활의<br />
            모든 것을<br />
            <span
              style={{
                background: 'linear-gradient(95deg, var(--accent) 0%, #2563eb 60%, #1d4ed8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              한 곳에.
            </span>
          </h1>

          {/* 서브타이틀 */}
          <p style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', fontSize: 13, color: 'var(--panel-text-muted)', marginTop: 4, lineHeight: 1.6 }}>
            상벌점 관리, 학생 정보, 보고서까지<br />
            교사와 학생을 위한 통합 플랫폼.
          </p>
        </div>
      </div>

      {/* 하단 저작권 */}
      <div className="relative z-10" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <p style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', fontSize: 11, color: 'var(--panel-text-sub)', transition: 'color 0.3s' }}>
          ⓒ 2026. 경북소프트웨어마이스터고등학교 All Rights Reserved.
        </p>
        <p style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', fontSize: 11, color: 'var(--panel-text-sub)', opacity: 0.6 }}>
          Made by <span style={{ opacity: 0.85 }}>김동혁</span>
        </p>
      </div>
    </div>
  )
}
