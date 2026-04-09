import SuccessModal from '@/app/components/ui/success-modal'

export type AccountModalState = {
  open: boolean
  type: 'success' | 'error'
  title: string
  description: string
}

export const CLOSED_ACCOUNT_MODAL: AccountModalState = {
  open: false,
  type: 'success',
  title: '',
  description: '',
}

export function buildCreationResultDescription({
  message,
  accountId,
  temporaryPassword,
}: {
  message: string
  accountId: string
  temporaryPassword: string
}) {
  return [
    message,
    `아이디: ${accountId}`,
    `임시 비밀번호: ${temporaryPassword}`,
  ].join('\n')
}

export function AccountPageIntro({
  title,
  description,
  eyebrow,
}: {
  title: string
  description: string
  eyebrow?: string
}) {
  return (
    <div>
      {eyebrow ? (
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--accent)',
            marginBottom: 6,
            fontFamily: 'var(--font-space-grotesk)',
          }}
        >
          {eyebrow}
        </p>
      ) : null}
      <h2
        className="text-base font-semibold"
        style={{
          fontFamily: 'var(--font-noto-sans-kr), sans-serif',
          color: 'var(--fg)',
        }}
      >
        {title}
      </h2>
      <p
        className="mt-1 text-xs"
        style={{
          fontFamily: 'var(--font-noto-sans-kr), sans-serif',
          color: 'var(--fg-muted)',
        }}
      >
        {description}
      </p>
    </div>
  )
}

export function AdminPanel({
  children,
  className = '',
  padded = true,
}: {
  children: React.ReactNode
  className?: string
  padded?: boolean
}) {
  const classes = [
    'rounded-2xl border',
    padded ? 'p-4' : 'overflow-hidden',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <section
      className={classes}
      style={{
        borderColor: 'var(--border)',
        backgroundColor: 'var(--bg)',
      }}
    >
      {children}
    </section>
  )
}

export function AccountResultModal({
  modal,
  onClose,
}: {
  modal: AccountModalState
  onClose: () => void
}) {
  return (
    <SuccessModal
      open={modal.open}
      onClose={onClose}
      type={modal.type}
      title={modal.title}
      description={modal.description}
      autoCloseMs={modal.type === 'success' ? 0 : 3000}
    />
  )
}

export function MetricChip({
  label,
  value,
  accent = false,
}: {
  label: string
  value: number
  accent?: boolean
}) {
  return (
    <div
      className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs"
      style={{
        borderColor: accent ? 'var(--accent-border)' : 'var(--border)',
        backgroundColor: accent ? 'var(--accent-subtle)' : 'var(--bg)',
        color: accent ? 'var(--accent)' : 'var(--fg-muted)',
        fontFamily: 'var(--font-noto-sans-kr), sans-serif',
      }}
    >
      <span>{label}</span>
      <strong style={{ color: 'var(--fg)' }}>{value}</strong>
    </div>
  )
}

export function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{
        fontFamily: 'var(--font-noto-sans-kr), sans-serif',
        backgroundColor: isActive
          ? 'var(--reward-bg-muted)'
          : 'rgba(148,163,184,0.18)',
        color: isActive ? '#15803d' : 'var(--fg-muted)',
      }}
    >
      {isActive ? '활성' : '비활성'}
    </span>
  )
}

export function DormBadge({ enabled }: { enabled: boolean }) {
  return (
    <span
      className="inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{
        fontFamily: 'var(--font-noto-sans-kr), sans-serif',
        backgroundColor: enabled
          ? 'rgba(59,130,246,0.12)'
          : 'rgba(148,163,184,0.18)',
        color: enabled ? '#1d4ed8' : 'var(--fg-muted)',
      }}
    >
      {enabled ? '사용' : '미사용'}
    </span>
  )
}

export const filterLabelStyle =
  'mb-1.5 block text-xs font-medium text-[var(--fg-muted)]'

export const monoCellStyle = {
  color: 'var(--fg-muted)',
  fontFamily: 'var(--font-space-grotesk)',
} satisfies React.CSSProperties

export const textCellStyle = {
  color: 'var(--fg)',
  fontFamily: 'var(--font-noto-sans-kr), sans-serif',
} satisfies React.CSSProperties
