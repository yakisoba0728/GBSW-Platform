export default function AdminStudentsPage() {
  return (
    <div className="max-w-[540px]">
      <h2
        className="text-base font-semibold"
        style={{
          fontFamily: 'var(--font-noto-sans-kr), sans-serif',
          color: 'var(--fg)',
        }}
      >
        학생 관리
      </h2>
      <p
        className="mt-1 text-xs leading-relaxed"
        style={{
          fontFamily: 'var(--font-noto-sans-kr), sans-serif',
          color: 'var(--fg-muted)',
        }}
      >
        지금 단계에서는 학생 계정 생성만 연결되어 있습니다. 학생 조회, 수정,
        삭제 기능은 다음 단계에서 DB와 연결할 예정입니다.
      </p>
    </div>
  )
}
