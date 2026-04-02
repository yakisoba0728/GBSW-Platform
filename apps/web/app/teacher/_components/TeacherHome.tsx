'use client'

import { Card, NoticeBox } from '@/app/components/teacher/teacher-shared'
import { useRulesContext } from './RulesContext'

export default function TeacherHome() {
  const { rules, isRulesLoading, rulesError } = useRulesContext()
  const rewardRules = rules.filter((rule) => rule.type === 'reward').length
  const penaltyRules = rules.filter((rule) => rule.type === 'penalty').length

  return (
    <div className="space-y-4">
      {rulesError && <NoticeBox type="error" message={rulesError} />}

      <Card>
        <div className="space-y-2">
          <p
            className="text-lg font-semibold"
            style={{
              fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              color: 'var(--admin-text)',
            }}
          >
            학교 상벌점 관리
          </p>
          <p
            className="max-w-3xl text-sm leading-6"
            style={{
              fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              color: 'var(--admin-text-muted)',
            }}
          >
            교사 화면에서는 학생에게 상점과 벌점을 부여하고, 이미 저장된 학교
            상벌점 내역을 검색해 수정하거나 삭제할 수 있습니다.
          </p>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <p
            className="text-xs"
            style={{
              fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              color: 'var(--admin-text-muted)',
            }}
          >
            활성 규칙 수
          </p>
          <p
            className="mt-2 text-3xl font-semibold"
            style={{
              fontFamily: 'var(--font-space-grotesk)',
              color: 'var(--admin-text)',
            }}
          >
            {isRulesLoading ? '...' : rules.length}
          </p>
        </Card>

        <Card>
          <p
            className="text-xs"
            style={{
              fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              color: 'var(--admin-text-muted)',
            }}
          >
            상점 규칙
          </p>
          <p
            className="mt-2 text-3xl font-semibold"
            style={{
              fontFamily: 'var(--font-space-grotesk)',
              color: '#16a34a',
            }}
          >
            {isRulesLoading ? '...' : rewardRules}
          </p>
        </Card>

        <Card>
          <p
            className="text-xs"
            style={{
              fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              color: 'var(--admin-text-muted)',
            }}
          >
            벌점 규칙
          </p>
          <p
            className="mt-2 text-3xl font-semibold"
            style={{
              fontFamily: 'var(--font-space-grotesk)',
              color: '#dc2626',
            }}
          >
            {isRulesLoading ? '...' : penaltyRules}
          </p>
        </Card>
      </div>
    </div>
  )
}
