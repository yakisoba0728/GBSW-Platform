'use client'

import { useState } from 'react'
import {
  Divider,
  FieldBlock,
  FormActions,
  FormNotice,
  inputBase,
  inputBaseStyle,
  PasswordRuleBox,
  type Notice,
  type TeacherFormState,
  SectionLabel,
  formatPhoneNumberInput,
  TEACHER_INITIAL,
} from './account-form-shared'

export default function TeacherCreateForm() {
  const [teacher, setTeacher] = useState<TeacherFormState>(TEACHER_INITIAL)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [notice, setNotice] = useState<Notice>(null)

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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
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

      const createdTeacherId =
        payload?.teacher?.teacherId ?? teacher.teacherId.trim()

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

  return (
    <div className="max-w-[640px]">
      <div className="mb-7">
        <h2
          className="text-base font-semibold"
          style={{
            fontFamily: 'var(--font-noto-sans-kr), sans-serif',
            color: 'var(--fg)',
          }}
        >
          교사 계정 생성
        </h2>
        <p
          className="mt-1 text-xs leading-relaxed"
          style={{
            fontFamily: 'var(--font-noto-sans-kr), sans-serif',
            color: 'var(--fg-muted)',
          }}
        >
          새 교사 계정의 정보를 입력하세요. 교사 아이디는 직접 입력하고 임시
          비밀번호는 교사 아이디와 전화번호 뒤 4자리로 설정됩니다.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div
          className="overflow-hidden rounded-2xl border"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="px-6 py-5" style={{ backgroundColor: 'var(--bg)' }}>
            <SectionLabel>교사 정보</SectionLabel>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                  style={{ ...inputBaseStyle, fontFamily: 'var(--font-space-grotesk)' }}
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
                  style={{ ...inputBaseStyle, fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
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
                  style={{ ...inputBaseStyle, fontFamily: 'var(--font-space-grotesk)' }}
                />
              </FieldBlock>
            </div>
          </div>

          <Divider />

          <div className="px-6 py-5" style={{ backgroundColor: 'var(--bg)' }}>
            <SectionLabel>초기 비밀번호</SectionLabel>
            <PasswordRuleBox>
              교사 임시 비밀번호는 교사 아이디와 전화번호 뒤 4자리로
              설정되며, 첫 로그인 뒤 반드시 새 비밀번호로 변경해야 합니다.
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

      <FormNotice notice={notice} />
    </div>
  )
}
