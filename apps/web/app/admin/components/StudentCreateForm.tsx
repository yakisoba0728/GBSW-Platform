'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/app/components/ui/button'
import {
  buildStudentId,
  Divider,
  FieldBlock,
  FormActions,
  IdPreview,
  InfoBox,
  inputBase,
  inputBaseStyle,
  PasswordRuleBox,
  type StudentFormState,
  SCHOOLS,
  SectionLabel,
  sortUniqueSubjects,
  formatPhoneNumberInput,
  STUDENT_INITIAL,
} from './account-form-shared'
import {
  AccountPageIntro,
  AccountResultModal,
  buildCreationResultDescription,
  CLOSED_ACCOUNT_MODAL,
} from '@/app/components/admin/account-ui-shared'

export default function StudentCreateForm() {
  const [student, setStudent] = useState<StudentFormState>(STUDENT_INITIAL)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [modal, setModal] = useState(CLOSED_ACCOUNT_MODAL)
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
      setModal((prev) => ({ ...prev, open: false }))

      let nextValue = event.target.value

      if (key === 'phone') {
        nextValue = formatPhoneNumberInput(nextValue)
      }

      setStudent((prev) => ({ ...prev, [key]: nextValue }))
    }
  }

  function setStudentSchool(school: StudentFormState['school']) {
    setModal((prev) => ({ ...prev, open: false }))
    setStudent((prev) => ({ ...prev, school }))
  }

  function setFirstEnrollment(checked: boolean) {
    setModal((prev) => ({ ...prev, open: false }))
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
      setModal({ open: true, type: 'error', title: '입력 오류', description: '추가할 전공과목 이름을 입력해주세요.' })
      return
    }

    const nextOptions = sortUniqueSubjects([...majorSubjectOptions, normalized])

    setMajorSubjectOptions(nextOptions)
    setMajorSubjectDraft('')
    setModal((prev) => ({ ...prev, open: false }))
    setStudent((prev) => ({ ...prev, majorSubject: normalized }))
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setModal((prev) => ({ ...prev, open: false }))

    if (!studentId) {
      setModal({
        open: true,
        type: 'error',
        title: '입력 오류',
        description: '학생 아이디를 만들 수 있도록 최초 입학 년도, 반, 번호를 입력해주세요.',
      })
      return
    }

    if (!student.majorSubject.trim()) {
      setModal({
        open: true,
        type: 'error',
        title: '입력 오류',
        description: '전공과목을 선택하거나 직접 추가해주세요.',
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
        setModal({
          open: true,
          type: 'error',
          title: '생성 실패',
          description: payload?.message ?? '학생 계정을 생성하지 못했습니다.',
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
      setModal({
        open: true,
        type: 'success',
        title: '학생 계정 생성 완료',
        description: buildCreationResultDescription({
          message: payload?.message ?? '학생 계정이 생성되었습니다.',
          accountId: payload?.student?.studentId ?? studentId,
          temporaryPassword: payload?.student?.temporaryPassword ?? '',
        }),
      })
    } catch {
      setModal({
        open: true,
        type: 'error',
        title: '생성 실패',
        description: '학생 계정 생성 요청 중 문제가 발생했습니다.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-[640px]">
      <div className="mb-7">
        <AccountPageIntro
          title="학생 계정 생성"
          description="학생 아이디 생성 정보로 아이디를 만들고, 현재 년도/반/번호와 전공과목을 저장합니다. 임시 비밀번호는 계정 생성 직후 한 번만 표시되므로 반드시 복사해 두세요."
        />
      </div>

      <form onSubmit={handleSubmit}>
        <div
          className="overflow-hidden rounded-2xl border"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="px-6 py-5" style={{ backgroundColor: 'var(--bg)' }}>
            <SectionLabel>학생 정보</SectionLabel>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  style={{ ...inputBaseStyle, fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
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
                  style={{ ...inputBaseStyle, fontFamily: 'var(--font-space-grotesk)' }}
                />
              </FieldBlock>
            </div>
          </div>

          <Divider />

          <div className="px-6 py-5" style={{ backgroundColor: 'var(--bg)' }}>
            <SectionLabel>아이디 생성 정보</SectionLabel>

            <div className="mb-4">
              <p
                className="mb-1.5 block text-xs font-medium"
                style={{
                  fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                  color: 'var(--fg-muted)',
                }}
              >
                학교
              </p>
              <div
                className="inline-flex rounded-lg border p-0.5"
                style={{
                  backgroundColor: 'var(--bg-subtle)',
                  borderColor: 'var(--border)',
                }}
              >
                {SCHOOLS.map((school) => {
                  const isActive = student.school === school.id

                  return (
                    <button
                      key={school.id}
                      type="button"
                      onClick={() => setStudentSchool(school.id)}
                      disabled={isSubmitting}
                      className="flex flex-col items-start rounded-md px-4 py-2 transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-60"
                      style={{
                        backgroundColor: isActive
                          ? 'var(--accent-subtle)'
                          : 'transparent',
                        border: isActive
                          ? '1px solid var(--accent)'
                          : '1px solid transparent',
                      }}
                    >
                      <span
                        className="text-sm font-semibold"
                        style={{
                          fontFamily: 'var(--font-space-grotesk)',
                          color: isActive
                            ? 'var(--accent)'
                            : 'var(--fg-muted)',
                        }}
                      >
                        {school.label}
                      </span>
                      <span
                        className="mt-0.5 text-[11px]"
                        style={{
                          fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                          color: isActive
                            ? 'var(--accent)'
                            : 'var(--fg-muted)',
                          opacity: 0.75,
                        }}
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
                  style={{ ...inputBaseStyle, fontFamily: 'var(--font-space-grotesk)' }}
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
                  style={{ ...inputBaseStyle, fontFamily: 'var(--font-space-grotesk)' }}
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
                  style={{ ...inputBaseStyle, fontFamily: 'var(--font-space-grotesk)' }}
                />
              </FieldBlock>
            </div>

            <IdPreview studentId={studentId} />
          </div>

          <Divider />

          <div className="px-6 py-5" style={{ backgroundColor: 'var(--bg)' }}>
            <SectionLabel>현재 정보</SectionLabel>

            <label
              className="mb-4 inline-flex cursor-pointer items-center gap-2"
              style={{
                fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                color: 'var(--fg)',
              }}
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
              <label
                htmlFor="s-major-subject"
                className="mb-1.5 block text-xs font-medium"
                style={{
                  fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                  color: 'var(--fg-muted)',
                }}
              >
                전공과목
              </label>
              <select
                id="s-major-subject"
                value={student.majorSubject}
                onChange={setStudentField('majorSubject')}
                disabled={isSubmitting}
                className={inputBase}
                style={{ ...inputBaseStyle, fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
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
                style={{
                  fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                  color: 'var(--fg-muted)',
                }}
              >
                기존 학생 데이터에서 중복 제거한 전공과목만 선택지에
                표시됩니다.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <input
                type="text"
                placeholder="새 전공과목 직접 추가"
                value={majorSubjectDraft}
                onChange={(event) => setMajorSubjectDraft(event.target.value)}
                disabled={isSubmitting}
                className={inputBase}
                style={{ ...inputBaseStyle, fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
              />
              <Button
                variant="secondary"
                size="md"
                onClick={addMajorSubjectOption}
                disabled={isSubmitting}
              >
                추가하기
              </Button>
            </div>
          </div>

          <Divider />

          <div className="px-6 py-5" style={{ backgroundColor: 'var(--bg)' }}>
            <SectionLabel>초기 비밀번호</SectionLabel>
            <PasswordRuleBox>
              임시 비밀번호는 계정 생성 시 무작위로 생성됩니다. 생성 완료
              모달에 표시되며, 이후 다시 확인할 수 없으므로 즉시 전달하세요.
              첫 로그인 뒤 반드시 새 비밀번호로 변경해야 합니다.
            </PasswordRuleBox>
          </div>
        </div>

        <FormActions
          onReset={() => {
            setStudent(STUDENT_INITIAL)
            setMajorSubjectDraft('')
            setModal((prev) => ({ ...prev, open: false }))
          }}
          isSubmitting={isSubmitting}
          submitLabel="학생 계정 생성"
        />
      </form>

      <AccountResultModal
        modal={modal}
        onClose={() => setModal((prev) => ({ ...prev, open: false }))}
      />
    </div>
  )
}
