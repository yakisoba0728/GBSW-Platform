export default function OnboardingProgress({
  step, total, label,
}: { step: number; total: number; label: string }) {
  return (
    <div style={{
      padding: '16px 24px 0',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}>
      <div style={{ display: 'flex', gap: 6 }}>
        {Array.from({ length: total }, (_, i) => (
          <div
            key={i}
            style={{
              width: i + 1 === step ? 24 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: i + 1 <= step ? 'var(--accent)' : 'var(--border)',
              transition: 'all 0.3s',
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
        {step}/{total} {label}
      </span>
    </div>
  )
}
