'use client'

import { useState } from 'react'
import {
  Divider,
  FieldBlock,
  FormActions,
  inputBase,
  inputBaseStyle,
  PasswordRuleBox,
  type TeacherFormState,
  SectionLabel,
  formatPhoneNumberInput,
  TEACHER_INITIAL,
} from './account-form-shared'
import {
  AccountPageIntro,
  AccountResultModal,
  buildCreationResultDescription,
  CLOSED_ACCOUNT_MODAL,
} from '@/app/components/admin/account-ui-shared'

export default function TeacherCreateForm() {
  const [teacher, setTeacher] = useState<TeacherFormState>(TEACHER_INITIAL)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [modal, setModal] = useState(CLOSED_ACCOUNT_MODAL)

  function setTeacherField<K extends keyof TeacherFormState>(key: K) {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      setModal((prev) => ({ ...prev, open: false }))

      const nextValue =
        key === 'phone'
          ? formatPhoneNumberInput(event.target.value)
          : event.target.value

      setTeacher((prev) => ({ ...prev, [key]: nextValue }))
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setModal((prev) => ({ ...prev, open: false }))
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
        setModal({
          open: true,
          type: 'error',
          title: '생성 실패',
          description: payload?.message ?? '교사 계정을 생성하지 못했습니다.',
        })
        return
      }

      const createdTeacherId =
        payload?.teacher?.teacherId ?? teacher.teacherId.trim()

      setTeacher(TEACHER_INITIAL)
      setModal({
        open: true,
        type: 'success',
        title: '교사 계정 생성 완료',
        description: buildCreationResultDescription({
          message: payload?.message ?? '교사 계정이 생성되었습니다.',
          accountId: createdTeacherId,
          temporaryPassword: payload?.teacher?.temporaryPassword ?? '',
        }),
      })
    } catch {
      setModal({
        open: true,
        type: 'error',
        title: '생성 실패',
        description: '교사 계정 생성 요청 중 문제가 발생했습니다.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-[640px]">
      <div className="mb-7">
        <AccountPageIntro
          title="교사 계정 생성"
          description="새 교사 계정의 정보를 입력하세요. 임시 비밀번호는 계정 생성 직후 한 번만 표시되므로 반드시 복사해 두세요."
        />
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
              임시 비밀번호는 계정 생성 시 무작위로 생성됩니다. 생성 완료
              모달에 표시되며, 이후 다시 확인할 수 없으므로 즉시 전달하세요.
              첫 로그인 뒤 반드시 새 비밀번호로 변경해야 합니다.
            </PasswordRuleBox>
          </div>
        </div>

        <FormActions
          onReset={() => {
            setTeacher(TEACHER_INITIAL)
            setModal((prev) => ({ ...prev, open: false }))
          }}
          isSubmitting={isSubmitting}
          submitLabel="교사 계정 생성"
        />
      </form>

      <AccountResultModal
        modal={modal}
        onClose={() => setModal((prev) => ({ ...prev, open: false }))}
      />
    </div>
  )
}
