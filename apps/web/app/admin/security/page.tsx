export default function AdminSecurityPage() {
  return (
    <div className="max-w-[720px] space-y-5">
      <div>
        <h2
          className="text-base font-semibold"
          style={{
            fontFamily: 'var(--font-noto-sans-kr), sans-serif',
            color: 'var(--fg)',
          }}
        >
          관리자 보안
        </h2>
        <p
          className="mt-1 text-xs leading-relaxed"
          style={{
            fontFamily: 'var(--font-noto-sans-kr), sans-serif',
            color: 'var(--fg-muted)',
          }}
        >
          최고관리자 비밀번호는 앱 안에서 변경하지 않고 서버 환경변수로 관리합니다.
        </p>
      </div>

      <section
        className="rounded-2xl border p-5"
        style={{
          borderColor: 'var(--border)',
          backgroundColor: 'var(--bg)',
        }}
      >
        <div className="space-y-4">
          <div>
            <h3
              className="text-sm font-semibold"
              style={{
                fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                color: 'var(--fg)',
              }}
            >
              운영 변경 방법
            </h3>
            <p
              className="mt-2 text-sm leading-relaxed"
              style={{
                fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                color: 'var(--fg-muted)',
              }}
            >
              서버의 환경변수 파일에서 `SUPER_ADMIN_ID`, `SUPER_ADMIN_PASSWORD`
              값을 수정한 뒤 재배포하면 새 값이 적용됩니다.
            </p>
          </div>

          <div
            className="rounded-xl border px-4 py-4 text-sm"
            style={{
              borderColor: 'var(--accent-border)',
              backgroundColor: 'var(--accent-subtle)',
              color: 'var(--fg-muted)',
              fontFamily: 'var(--font-noto-sans-kr), sans-serif',
            }}
          >
            학생과 교사 계정의 비밀번호 변경은 서비스 안에서 계속 지원되지만,
            최고관리자 계정은 서버 설정과 함께 관리하는 구조입니다.
          </div>
        </div>
      </section>
    </div>
  )
}
