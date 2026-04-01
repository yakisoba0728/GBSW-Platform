'use client'

import { useEffect, useState } from 'react'

const inputBase = `
  w-full px-3.5 py-2.5 rounded-lg text-sm outline-none transition-all duration-150
  bg-white dark:bg-white/[0.05]
  border border-gray-200 dark:border-white/[0.08]
  text-brand-navy dark:text-[#e2e1f0]
  placeholder:text-gray-400 dark:placeholder:text-white/[0.18]
  focus:border-[--admin-accent] focus:ring-2 focus:ring-[--admin-accent]/10
  disabled:opacity-60 disabled:cursor-not-allowed
`.trim()

type School = 'GBSW' | 'BYMS'
type AccountType = 'student' | 'teacher'
type Notice = { type: 'error' | 'success'; text: string } | null

type StudentFormState = {
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

type TeacherFormState = {
  teacherId: string
  name: string
  phone: string
}

const SCHOOLS: { id: School; label: string; prefix: string; full: string }[] = [
  { id: 'GBSW', label: 'GBSW', prefix: 'GB', full: '경북소프트웨어마이스터고등학교' },
  { id: 'BYMS', label: 'BYMS', prefix: 'BY', full: '봉양중학교' },
]

const STUDENT_INITIAL: StudentFormState = {
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

const TEACHER_INITIAL: TeacherFormState = {
  teacherId: '',
  name: '',
  phone: '',
}

const TYPE_TABS: { id: AccountType; label: string }[] = [
  { id: 'student', label: '학생' },
  { id: 'teacher', label: '교사' },
]

const headings = {
  student: {
    title: '학생 계정 생성',
    desc: '학생 아이디 생성 정보로 아이디를 만들고, 현재 년도/반/번호와 전공과목을 저장합니다. 생성 직후 임시 비밀번호는 생성된 아이디와 전화번호 뒤 4자리로 설정됩니다.',
  },
  teacher: {
    title: '교사 계정 생성',
    desc: '새 교사 계정의 정보를 입력하세요. 교사 아이디는 직접 입력하고 임시 비밀번호는 교사 아이디와 전화번호 뒤 4자리로 설정됩니다.',
  },
}

export default function CreateTab() {
  const [type, setType] = useState<AccountType>('student')
  const [student, setStudent] = useState<StudentFormState>(STUDENT_INITIAL)
  const [teacher, setTeacher] = useState<TeacherFormState>(TEACHER_INITIAL)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)
  const [majorSubjectOptions, setMajorSubjectOptions] = useState<string[]>([])
  const [majorSubjectDraft, setMajorSubjectDraft] = useState('')

  const studentId = buildStudentId(
    student.school,
    student.admissionYear,
    student.admissionClassNumber,
    student.admissionStudentNumber,
  )

  useEffect(() => {
    void loadMajorSubjectOptions()
  }, [])

  async function loadMajorSubjectOptions() {
    try {
      const response = await fetch('/api/admin/students/major-subjects', {
        cache: 'no-store',
      })

      if (!response.ok) {
        return
      }

      const payload = await response.json().catch(() => null)
      const nextOptions = Array.isArray(payload?.majorSubjects)
        ? payload.majorSubjects.filter(
            (value: unknown): value is string =>
              typeof value === 'string' && value.trim().length > 0,
          )
        : []

      setMajorSubjectOptions(sortUniqueSubjects(nextOptions))
    } catch {
      setMajorSubjectOptions([])
    }
  }

  function setStudentField<K extends keyof StudentFormState>(key: K) {
    return (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setNotice(null)

      let nextValue = event.target.value

      if (key === 'phone') {
        nextValue = formatPhoneNumberInput(nextValue)
      }

      setStudent((prev) => ({ ...prev, [key]: nextValue }))
    }
  }

  function setTeacherField<K extends keyof TeacherFormState>(key: K) {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      setNotice(null)

      const nextValue =
        key === 'phone'
          ? formatPhoneNumberInput(event.target.value)
          : event.target.value

      setTeacher((prev) => ({ ...prev, [key]: nextValue }))
    }
  }

  function setStudentSchool(school: School) {
    setNotice(null)
    setStudent((prev) => ({ ...prev, school }))
  }

  function setFirstEnrollment(checked: boolean) {
    setNotice(null)
    setStudent((prev) => ({
      ...prev,
      isFirstEnrollment: checked,
      currentYear: checked ? '' : prev.currentYear,
      currentClassNumber: checked ? '' : prev.currentClassNumber,
      currentStudentNumber: checked ? '' : prev.currentStudentNumber,
    }))
  }

  function addMajorSubjectOption() {
    const normalized = majorSubjectDraft.trim()

    if (!normalized) {
      setNotice({
        type: 'error',
        text: '추가할 전공과목 이름을 입력해주세요.',
      })
      return
    }

    const nextOptions = sortUniqueSubjects([...majorSubjectOptions, normalized])

    setMajorSubjectOptions(nextOptions)
    setMajorSubjectDraft('')
    setNotice(null)
    setStudent((prev) => ({ ...prev, majorSubject: normalized }))
  }

  async function handleStudentSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice(null)

    if (!studentId) {
      setNotice({
        type: 'error',
        text: '학생 아이디를 만들 수 있도록 최초 입학 년도, 반, 번호를 입력해주세요.',
      })
      return
    }

    if (!student.majorSubject.trim()) {
      setNotice({
        type: 'error',
        text: '전공과목을 선택하거나 직접 추가해주세요.',
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/admin/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          school: student.school,
          admissionYear: student.admissionYear,
          classNumber: student.admissionClassNumber,
          studentNumber: student.admissionStudentNumber,
          isFirstEnrollment: student.isFirstEnrollment,
          currentYear: student.currentYear,
          currentClassNumber: student.currentClassNumber,
          currentStudentNumber: student.currentStudentNumber,
          majorSubject: student.majorSubject,
          name: student.name,
          phone: student.phone,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        setNotice({
          type: 'error',
          text: payload?.message ?? '학생 계정을 생성하지 못했습니다.',
        })
        return
      }

      setStudent(STUDENT_INITIAL)
      setMajorSubjectOptions((prev) =>
        sortUniqueSubjects([
          ...prev,
          payload?.student?.majorSubject ?? student.majorSubject,
        ]),
      )
      setNotice({
        type: 'success',
        text: [
          payload?.message ?? '학생 계정이 생성되었습니다.',
          `아이디: ${payload?.student?.studentId ?? studentId}`,
          `임시 비밀번호: ${
            payload?.student?.temporaryPassword ??
            payload?.student?.initialPassword ??
            ''
          }`,
        ].join('\n'),
      })
    } catch {
      setNotice({
        type: 'error',
        text: '학생 계정 생성 요청 중 문제가 발생했습니다.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleTeacherSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setNotice(null)
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/admin/teachers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teacherId: teacher.teacherId,
          name: teacher.name,
          phone: teacher.phone,
        }),
      })

      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        setNotice({
          type: 'error',
          text: payload?.message ?? '교사 계정을 생성하지 못했습니다.',
        })
        return
      }

      const createdTeacherId = payload?.teacher?.teacherId ?? teacher.teacherId.trim()

      setTeacher(TEACHER_INITIAL)
      setNotice({
        type: 'success',
        text: [
          payload?.message ?? '교사 계정이 생성되었습니다.',
          `아이디: ${createdTeacherId}`,
          `임시 비밀번호: ${
            payload?.teacher?.temporaryPassword ??
            payload?.teacher?.initialPassword ??
            ''
          }`,
        ].join('\n'),
      })
    } catch {
      setNotice({
        type: 'error',
        text: '교사 계정 생성 요청 중 문제가 발생했습니다.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  function switchType(nextType: AccountType) {
    setType(nextType)
    setNotice(null)
  }

  return (
    <div className="max-w-[640px]">
      <div
        className="inline-flex rounded-xl p-0.5 mb-6 border"
        style={{ backgroundColor: 'var(--admin-sidebar-bg)', borderColor: 'var(--admin-border)' }}
      >
        {TYPE_TABS.map((tab) => {
          const isActive = type === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => switchType(tab.id)}
              disabled={isSubmitting}
              className="px-5 py-1.5 rounded-lg text-sm transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--admin-accent)' : 'var(--admin-text-muted)',
                backgroundColor: isActive ? 'var(--admin-accent-bg)' : 'transparent',
                border: isActive ? '1px solid var(--admin-accent)' : '1px solid transparent',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="mb-7">
        <h2
          className="text-base font-semibold"
          style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text)' }}
        >
          {headings[type].title}
        </h2>
        <p
          className="mt-1 text-xs leading-relaxed"
          style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text-muted)' }}
        >
          {headings[type].desc}
        </p>
      </div>

      {type === 'student' ? (
        <form onSubmit={handleStudentSubmit}>
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ borderColor: 'var(--admin-border)' }}
          >
            <div className="px-6 py-5" style={{ backgroundColor: 'var(--admin-bg)' }}>
              <SectionLabel>학생 정보</SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldBlock label="이름" htmlFor="s-name">
                  <input
                    id="s-name"
                    type="text"
                    autoComplete="off"
                    placeholder="홍길동"
                    value={student.name}
                    onChange={setStudentField('name')}
                    disabled={isSubmitting}
                    className={inputBase}
                    style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
                  />
                </FieldBlock>
                <FieldBlock label="전화번호" htmlFor="s-phone">
                  <input
                    id="s-phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="010-0000-0000"
                    inputMode="numeric"
                    maxLength={13}
                    value={student.phone}
                    onChange={setStudentField('phone')}
                    disabled={isSubmitting}
                    className={inputBase}
                    style={{ fontFamily: 'var(--font-space-grotesk)' }}
                  />
                </FieldBlock>
              </div>
            </div>

            <Divider />

            <div className="px-6 py-5" style={{ backgroundColor: 'var(--admin-bg)' }}>
              <SectionLabel>아이디 생성 정보</SectionLabel>

              <div className="mb-4">
                <FieldLabel htmlFor="s-school">학교</FieldLabel>
                <div
                  id="s-school"
                  className="inline-flex rounded-lg p-0.5 border"
                  style={{ backgroundColor: 'var(--admin-sidebar-bg)', borderColor: 'var(--admin-border)' }}
                >
                  {SCHOOLS.map((school) => {
                    const isActive = student.school === school.id
                    return (
                      <button
                        key={school.id}
                        type="button"
                        onClick={() => setStudentSchool(school.id)}
                        disabled={isSubmitting}
                        className="flex flex-col items-start px-4 py-2 rounded-md transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-60"
                        style={{
                          backgroundColor: isActive ? 'var(--admin-accent-bg)' : 'transparent',
                          border: isActive ? '1px solid var(--admin-accent)' : '1px solid transparent',
                        }}
                      >
                        <span
                          className="text-sm font-semibold"
                          style={{ fontFamily: 'var(--font-space-grotesk)', color: isActive ? 'var(--admin-accent)' : 'var(--admin-text-muted)' }}
                        >
                          {school.label}
                        </span>
                        <span
                          className="text-[11px] mt-0.5"
                          style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: isActive ? 'var(--admin-accent)' : 'var(--admin-text-muted)', opacity: 0.75 }}
                        >
                          {school.full}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <FieldBlock label="아이디용 년도" htmlFor="s-admission-year">
                  <input
                    id="s-admission-year"
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    placeholder="2026"
                    value={student.admissionYear}
                    onChange={setStudentField('admissionYear')}
                    disabled={isSubmitting}
                    className={inputBase}
                    style={{ fontFamily: 'var(--font-space-grotesk)' }}
                  />
                </FieldBlock>
                <FieldBlock label="아이디용 반" htmlFor="s-admission-class">
                  <input
                    id="s-admission-class"
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    placeholder="1"
                    value={student.admissionClassNumber}
                    onChange={setStudentField('admissionClassNumber')}
                    disabled={isSubmitting}
                    className={inputBase}
                    style={{ fontFamily: 'var(--font-space-grotesk)' }}
                  />
                </FieldBlock>
                <FieldBlock label="아이디용 번호" htmlFor="s-admission-number">
                  <input
                    id="s-admission-number"
                    type="text"
                    inputMode="numeric"
                    maxLength={2}
                    placeholder="5"
                    value={student.admissionStudentNumber}
                    onChange={setStudentField('admissionStudentNumber')}
                    disabled={isSubmitting}
                    className={inputBase}
                    style={{ fontFamily: 'var(--font-space-grotesk)' }}
                  />
                </FieldBlock>
              </div>

              <IdPreview studentId={studentId} />
            </div>

            <Divider />

            <div className="px-6 py-5" style={{ backgroundColor: 'var(--admin-bg)' }}>
              <SectionLabel>현재 정보</SectionLabel>

              <label
                className="inline-flex items-center gap-2 mb-4 cursor-pointer"
                style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text)' }}
              >
                <input
                  type="checkbox"
                  checked={student.isFirstEnrollment}
                  onChange={(event) => setFirstEnrollment(event.target.checked)}
                  disabled={isSubmitting}
                  className="h-4 w-4 rounded border-gray-300 text-[--admin-accent] focus:ring-[--admin-accent]"
                />
                <span className="text-sm">신입생 첫 가입</span>
              </label>

              {student.isFirstEnrollment ? (
                <InfoBox>
                  현재 년도/반/번호는 아이디 생성 정보와 동일하게 저장됩니다.
                </InfoBox>
              ) : (
                <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <FieldBlock label="현재 년도" htmlFor="s-current-year">
                    <input
                      id="s-current-year"
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="2026"
                      value={student.currentYear}
                      onChange={setStudentField('currentYear')}
                      disabled={isSubmitting}
                      className={inputBase}
                      style={{ fontFamily: 'var(--font-space-grotesk)' }}
                    />
                  </FieldBlock>
                  <FieldBlock label="현재 반" htmlFor="s-current-class">
                    <input
                      id="s-current-class"
                      type="text"
                      inputMode="numeric"
                      maxLength={2}
                      placeholder="1"
                      value={student.currentClassNumber}
                      onChange={setStudentField('currentClassNumber')}
                      disabled={isSubmitting}
                      className={inputBase}
                      style={{ fontFamily: 'var(--font-space-grotesk)' }}
                    />
                  </FieldBlock>
                  <FieldBlock label="현재 번호" htmlFor="s-current-number">
                    <input
                      id="s-current-number"
                      type="text"
                      inputMode="numeric"
                      maxLength={2}
                      placeholder="5"
                      value={student.currentStudentNumber}
                      onChange={setStudentField('currentStudentNumber')}
                      disabled={isSubmitting}
                      className={inputBase}
                      style={{ fontFamily: 'var(--font-space-grotesk)' }}
                    />
                  </FieldBlock>
                </div>
              )}

              <div className="mb-3">
                <FieldLabel htmlFor="s-major-subject">전공과목</FieldLabel>
                <select
                  id="s-major-subject"
                  value={student.majorSubject}
                  onChange={setStudentField('majorSubject')}
                  disabled={isSubmitting}
                  className={inputBase}
                  style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
                >
                  <option value="">전공과목을 선택하세요</option>
                  {majorSubjectOptions.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>
                <p
                  className="mt-1 text-xs"
                  style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text-muted)' }}
                >
                  기존 학생 데이터에서 중복 제거한 전공과목만 선택지에 표시됩니다.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto] gap-3">
                <input
                  type="text"
                  placeholder="새 전공과목 직접 추가"
                  value={majorSubjectDraft}
                  onChange={(event) => setMajorSubjectDraft(event.target.value)}
                  disabled={isSubmitting}
                  className={inputBase}
                  style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
                />
                <button
                  type="button"
                  onClick={addMajorSubjectOption}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl text-sm border transition-colors duration-150 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                    color: 'var(--admin-text)',
                    borderColor: 'var(--admin-border)',
                    backgroundColor: 'var(--admin-sidebar-bg)',
                  }}
                >
                  추가하기
                </button>
              </div>
            </div>

            <Divider />

            <div className="px-6 py-5" style={{ backgroundColor: 'var(--admin-bg)' }}>
              <SectionLabel>초기 비밀번호</SectionLabel>
              <PasswordRuleBox>
                학생 임시 비밀번호는 생성된 아이디와 전화번호 뒤 4자리로 설정되며, 첫 로그인 뒤 반드시 새 비밀번호로 변경해야 합니다.
              </PasswordRuleBox>
            </div>
          </div>

          <FormActions
            onReset={() => {
              setStudent(STUDENT_INITIAL)
              setMajorSubjectDraft('')
              setNotice(null)
            }}
            isSubmitting={isSubmitting}
            submitLabel="학생 계정 생성"
          />
        </form>
      ) : (
        <form onSubmit={handleTeacherSubmit}>
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'var(--admin-border)' }}>
            <div className="px-6 py-5" style={{ backgroundColor: 'var(--admin-bg)' }}>
              <SectionLabel>교사 정보</SectionLabel>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FieldBlock label="교사 아이디" htmlFor="t-id">
                  <input
                    id="t-id"
                    type="text"
                    autoComplete="off"
                    placeholder="teacher01"
                    value={teacher.teacherId}
                    onChange={setTeacherField('teacherId')}
                    disabled={isSubmitting}
                    className={inputBase}
                    style={{ fontFamily: 'var(--font-space-grotesk)' }}
                  />
                </FieldBlock>
                <FieldBlock label="이름" htmlFor="t-name">
                  <input
                    id="t-name"
                    type="text"
                    autoComplete="off"
                    placeholder="홍길동"
                    value={teacher.name}
                    onChange={setTeacherField('name')}
                    disabled={isSubmitting}
                    className={inputBase}
                    style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
                  />
                </FieldBlock>
                <FieldBlock label="전화번호" htmlFor="t-phone">
                  <input
                    id="t-phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="010-0000-0000"
                    inputMode="numeric"
                    maxLength={13}
                    value={teacher.phone}
                    onChange={setTeacherField('phone')}
                    disabled={isSubmitting}
                    className={inputBase}
                    style={{ fontFamily: 'var(--font-space-grotesk)' }}
                  />
                </FieldBlock>
              </div>
            </div>

            <Divider />

            <div className="px-6 py-5" style={{ backgroundColor: 'var(--admin-bg)' }}>
              <SectionLabel>초기 비밀번호</SectionLabel>
              <PasswordRuleBox>
                교사 임시 비밀번호는 교사 아이디와 전화번호 뒤 4자리로 설정되며, 첫 로그인 뒤 반드시 새 비밀번호로 변경해야 합니다.
              </PasswordRuleBox>
            </div>
          </div>

          <FormActions
            onReset={() => {
              setTeacher(TEACHER_INITIAL)
              setNotice(null)
            }}
            isSubmitting={isSubmitting}
            submitLabel="교사 계정 생성"
          />
        </form>
      )}

      <FormNotice notice={notice} />
    </div>
  )
}

function buildStudentId(
  school: School,
  year: string,
  classNumber: string,
  studentNumber: string,
) {
  const prefix = SCHOOLS.find((item) => item.id === school)?.prefix
  const normalizedYear = year.trim().slice(-2)
  const normalizedClass = classNumber.trim()
  const normalizedStudentNumber = studentNumber.trim()

  if (!prefix || !normalizedYear || !normalizedClass || !normalizedStudentNumber) {
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

function pad(value: string, length = 2) {
  return value.padStart(length, '0')
}

function formatPhoneNumberInput(value: string) {
  const digits = value.replaceAll(/\D/g, '').slice(0, 11)

  if (digits.length <= 3) {
    return digits
  }

  if (digits.length <= 7) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`
  }

  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

function sortUniqueSubjects(subjects: string[]) {
  return Array.from(
    new Set(subjects.map((subject) => subject.trim()).filter((subject) => subject.length > 0)),
  ).sort((left, right) => left.localeCompare(right, 'ko'))
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[11px] font-semibold uppercase tracking-widest mb-4"
      style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--admin-text-muted)' }}
    >
      {children}
    </p>
  )
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-medium mb-1.5"
      style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text-muted)' }}
    >
      {children}
    </label>
  )
}

function FieldBlock({
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

function Divider() {
  return <div style={{ height: 1, backgroundColor: 'var(--admin-border)' }} />
}

function InfoBox({ children }: { children: React.ReactNode }) {
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

function IdPreview({ studentId }: { studentId: string | null }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200"
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
        style={{ color: studentId ? 'var(--admin-accent)' : 'var(--admin-text-muted)', flexShrink: 0 }}
      >
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="M7 10h10M7 14h4" />
      </svg>
      <div className="flex items-baseline gap-2">
        <span
          className="text-xs flex-shrink-0"
          style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text-muted)' }}
        >
          생성될 아이디
        </span>
        {studentId ? (
          <span
            className="text-sm font-semibold tracking-widest"
            style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--admin-accent)' }}
          >
            {studentId}
          </span>
        ) : (
          <span
            className="text-xs"
            style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text-muted)' }}
          >
            아이디용 년도·반·번호를 입력하면 표시됩니다
          </span>
        )}
      </div>
    </div>
  )
}

function FormActions({
  onReset,
  isSubmitting,
  submitLabel,
}: {
  onReset: () => void
  isSubmitting: boolean
  submitLabel: string
}) {
  return (
    <div className="pt-5 flex items-center gap-3">
      <button
        type="submit"
        disabled={isSubmitting}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all duration-150 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
        style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', backgroundColor: 'var(--admin-accent)' }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
        className="px-4 py-2.5 rounded-xl text-sm transition-colors duration-150 border disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text-muted)', borderColor: 'var(--admin-border)' }}
      >
        초기화
      </button>
    </div>
  )
}

function FormNotice({ notice }: { notice: Notice }) {
  if (!notice) {
    return null
  }

  return (
    <p
      className="mt-4 text-sm whitespace-pre-line"
      style={{
        fontFamily: 'var(--font-noto-sans-kr), sans-serif',
        color: notice.type === 'success' ? '#15803d' : '#dc2626',
      }}
    >
      {notice.text}
    </p>
  )
}

function PasswordRuleBox({ children }: { children: React.ReactNode }) {
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
