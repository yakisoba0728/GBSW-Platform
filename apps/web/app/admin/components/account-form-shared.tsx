import { Button } from '@/app/components/ui/button'

export const inputBase = `
  w-full rounded-lg border px-3.5 py-2 text-sm outline-none transition-all duration-150
  disabled:cursor-not-allowed disabled:opacity-60
`.trim()

export const inputBaseStyle = {
  backgroundColor: 'var(--bg)',
  borderColor: 'var(--border)',
  color: 'var(--fg)',
} satisfies Record<string, string>

export type TeacherFormState = {
  teacherId: string
  name: string
  phone: string
}

export const TEACHER_INITIAL: TeacherFormState = {
  teacherId: '',
  name: '',
  phone: '',
}

export function formatPhoneNumberInput(value: string) {
  const digits = value.replaceAll(/\D/g, '').slice(0, 11)

  if (digits.length <= 3) {
    return digits
  }

  if (digits.length <= 7) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`
  }

  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mb-4 text-[11px] font-semibold uppercase tracking-widest"
      style={{
        fontFamily: 'var(--font-space-grotesk)',
        color: 'var(--fg-muted)',
      }}
    >
      {children}
    </p>
  )
}

export function FieldLabel({
  htmlFor,
  children,
}: {
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block text-xs font-medium"
      style={{
        fontFamily: 'var(--font-noto-sans-kr), sans-serif',
        color: 'var(--fg-muted)',
      }}
    >
      {children}
    </label>
  )
}

export function FieldBlock({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div>
      <FieldLabel htmlFor={htmlFor}>{label}</FieldLabel>
      {children}
    </div>
  )
}

export function Divider() {
  return <div style={{ height: 1, backgroundColor: 'var(--border)' }} />
}

export function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-md border px-3.5 py-3 text-sm"
      style={{
        fontFamily: 'var(--font-noto-sans-kr), sans-serif',
        color: 'var(--fg-muted)',
        borderColor: 'var(--border)',
        backgroundColor: 'var(--bg-subtle)',
      }}
    >
      {children}
    </div>
  )
}

export function PasswordRuleBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-md border px-3.5 py-3 text-sm"
      style={{
        fontFamily: 'var(--font-noto-sans-kr), sans-serif',
        color: 'var(--fg-muted)',
        borderColor: 'var(--border)',
        backgroundColor: 'var(--bg-subtle)',
      }}
    >
      {children}
    </div>
  )
}

export function FormActions({
  onReset,
  isSubmitting,
  submitLabel,
}: {
  onReset: () => void
  isSubmitting: boolean
  submitLabel: string
}) {
  return (
    <div className="flex items-center gap-3 pt-5">
      <Button
        type="submit"
        variant="primary"
        size="md"
        loading={isSubmitting}
        disabled={isSubmitting}
        icon={
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <line x1="19" y1="8" x2="19" y2="14" />
            <line x1="22" y1="11" x2="16" y2="11" />
          </svg>
        }
      >
        {submitLabel}
      </Button>
      <Button
        variant="ghost"
        size="md"
        onClick={onReset}
        disabled={isSubmitting}
      >
        초기화
      </Button>
    </div>
  )
}
