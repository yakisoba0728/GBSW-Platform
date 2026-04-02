export const inputBase = `
  w-full rounded-lg border px-3.5 py-2.5 text-sm outline-none transition-all duration-150
  bg-white dark:bg-white/[0.05]
  border-gray-200 dark:border-white/[0.08]
  text-brand-navy dark:text-[#e2e1f0]
  placeholder:text-gray-400 dark:placeholder:text-white/[0.18]
  focus:border-[--admin-accent] focus:ring-2 focus:ring-[--admin-accent]/10
  disabled:cursor-not-allowed disabled:opacity-60
`.trim()

export type School = 'GBSW' | 'BYMS'

export type Notice = { type: 'error' | 'success'; text: string } | null

export type StudentFormState = {
  school: School
  admissionYear: string
  admissionClassNumber: string
  admissionStudentNumber: string
  isFirstEnrollment: boolean
  currentYear: string
  currentClassNumber: string
  currentStudentNumber: string
  majorSubject: string
  name: string
  phone: string
}

export type TeacherFormState = {
  teacherId: string
  name: string
  phone: string
}

export const SCHOOLS: Array<{
  id: School
  label: string
  prefix: string
  full: string
}> = [
  {
    id: 'GBSW',
    label: 'GBSW',
    prefix: 'GB',
    full: '경북소프트웨어마이스터고등학교',
  },
  {
    id: 'BYMS',
    label: 'BYMS',
    prefix: 'BY',
    full: '봉양중학교',
  },
]

export const STUDENT_INITIAL: StudentFormState = {
  school: 'GBSW',
  admissionYear: '',
  admissionClassNumber: '',
  admissionStudentNumber: '',
  isFirstEnrollment: false,
  currentYear: '',
  currentClassNumber: '',
  currentStudentNumber: '',
  majorSubject: '',
  name: '',
  phone: '',
}

export const TEACHER_INITIAL: TeacherFormState = {
  teacherId: '',
  name: '',
  phone: '',
}

export function buildStudentId(
  school: School,
  year: string,
  classNumber: string,
  studentNumber: string,
) {
  const prefix = SCHOOLS.find((item) => item.id === school)?.prefix
  const normalizedYear = year.trim().slice(-2)
  const normalizedClass = classNumber.trim()
  const normalizedStudentNumber = studentNumber.trim()

  if (
    !prefix ||
    !normalizedYear ||
    !normalizedClass ||
    !normalizedStudentNumber
  ) {
    return null
  }

  if (
    Number.isNaN(Number(normalizedClass)) ||
    Number.isNaN(Number(normalizedStudentNumber))
  ) {
    return null
  }

  return `${prefix}${normalizedYear}${pad(normalizedClass)}${pad(normalizedStudentNumber)}`
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

export function sortUniqueSubjects(subjects: string[]) {
  return Array.from(
    new Set(
      subjects
        .map((subject) => subject.trim())
        .filter((subject) => subject.length > 0),
    ),
  ).sort((left, right) => left.localeCompare(right, 'ko'))
}

function pad(value: string, length = 2) {
  return value.padStart(length, '0')
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="mb-4 text-[11px] font-semibold uppercase tracking-widest"
      style={{
        fontFamily: 'var(--font-space-grotesk)',
        color: 'var(--admin-text-muted)',
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
        color: 'var(--admin-text-muted)',
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
  return <div style={{ height: 1, backgroundColor: 'var(--admin-border)' }} />
}

export function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl border px-4 py-3 text-sm"
      style={{
        fontFamily: 'var(--font-noto-sans-kr), sans-serif',
        color: 'var(--admin-text-muted)',
        borderColor: 'var(--admin-border)',
        backgroundColor: 'var(--admin-sidebar-bg)',
      }}
    >
      {children}
    </div>
  )
}

export function PasswordRuleBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl border px-4 py-3 text-sm"
      style={{
        fontFamily: 'var(--font-noto-sans-kr), sans-serif',
        color: 'var(--admin-text-muted)',
        borderColor: 'var(--admin-border)',
        backgroundColor: 'var(--admin-sidebar-bg)',
      }}
    >
      {children}
    </div>
  )
}

export function IdPreview({ studentId }: { studentId: string | null }) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-200"
      style={{
        borderColor: studentId ? 'var(--admin-accent)' : 'var(--admin-border)',
        backgroundColor: studentId ? 'var(--admin-accent-bg)' : 'transparent',
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{
          color: studentId ? 'var(--admin-accent)' : 'var(--admin-text-muted)',
          flexShrink: 0,
        }}
      >
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="M7 10h10M7 14h4" />
      </svg>
      <div className="flex items-baseline gap-2">
        <span
          className="flex-shrink-0 text-xs"
          style={{
            fontFamily: 'var(--font-noto-sans-kr), sans-serif',
            color: 'var(--admin-text-muted)',
          }}
        >
          생성될 아이디
        </span>
        {studentId ? (
          <span
            className="text-sm font-semibold tracking-widest"
            style={{
              fontFamily: 'var(--font-space-grotesk)',
              color: 'var(--admin-accent)',
            }}
          >
            {studentId}
          </span>
        ) : (
          <span
            className="text-xs"
            style={{
              fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              color: 'var(--admin-text-muted)',
            }}
          >
            아이디용 년도·반·번호를 입력하면 표시됩니다
          </span>
        )}
      </div>
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
      <button
        type="submit"
        disabled={isSubmitting}
        className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-white transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
        style={{
          fontFamily: 'var(--font-noto-sans-kr), sans-serif',
          backgroundColor: 'var(--admin-accent)',
        }}
      >
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
        {isSubmitting ? '생성 중...' : submitLabel}
      </button>
      <button
        type="button"
        onClick={onReset}
        disabled={isSubmitting}
        className="rounded-xl border px-4 py-2.5 text-sm transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60"
        style={{
          fontFamily: 'var(--font-noto-sans-kr), sans-serif',
          color: 'var(--admin-text-muted)',
          borderColor: 'var(--admin-border)',
        }}
      >
        초기화
      </button>
    </div>
  )
}

export function FormNotice({ notice }: { notice: Notice }) {
  if (!notice) {
    return null
  }

  return (
    <p
      className="mt-4 whitespace-pre-line text-sm"
      style={{
        fontFamily: 'var(--font-noto-sans-kr), sans-serif',
        color: notice.type === 'success' ? '#15803d' : '#dc2626',
      }}
    >
      {notice.text}
    </p>
  )
}
