'use client'

import { useCallback, useEffect, useState } from 'react'
import DashboardLayout, { type DashboardNavItem } from './DashboardLayout'
import SchoolMileageGrant from './teacher/SchoolMileageGrant'
import SchoolMileageHistory from './teacher/SchoolMileageHistory'
import SchoolMileageStudentView from './teacher/SchoolMileageStudentView'
import SchoolMileageStats from './teacher/SchoolMileageStats'
import SchoolMileageClass from './teacher/SchoolMileageClass'
import SchoolMileageRules from './teacher/SchoolMileageRules'
import SchoolMileageReport from './teacher/SchoolMileageReport'
import { Card, NoticeBox } from './teacher/teacher-shared'
import type { SchoolMileageRuleSummary } from './teacher/school-mileage-types'

const NAV_ITEMS: DashboardNavItem[] = [
  {
    id: 'home',
    label: '홈',
    icon: (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: 'mileage',
    label: '그린 마일리지',
    section: '학생 관리',
    icon: (
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
    children: [
      { id: 'mileage-grant', label: '상벌점 부여' },
      { id: 'mileage-history', label: '상벌점 내역' },
      { id: 'mileage-student', label: '학생별 조회' },
      { id: 'mileage-stats', label: '통계 보기' },
      { id: 'mileage-class', label: '학급별 현황' },
      { id: 'mileage-rules', label: '상벌점 항목 관리' },
      { id: 'mileage-report', label: '보고서 출력' },
    ],
  },
]

export default function TeacherDashboard() {
  const [rules, setRules] = useState<SchoolMileageRuleSummary[]>([])
  const [isRulesLoading, setIsRulesLoading] = useState(true)
  const [rulesError, setRulesError] = useState<string | null>(null)

  const loadRules = useCallback(async () => {
    setIsRulesLoading(true)
    setRulesError(null)

    try {
      const response = await fetch('/api/teacher/school-mileage/rules', {
        cache: 'no-store',
      })
      const result = await response.json().catch(() => null)

      if (!response.ok) {
        setRulesError(result?.message ?? '상벌점 규칙을 불러오지 못했습니다.')
        setRules([])
        return
      }

      setRules(
        Array.isArray(result?.rules)
          ? (result.rules as SchoolMileageRuleSummary[])
          : [],
      )
    } catch {
      setRulesError('상벌점 규칙 조회 중 문제가 발생했습니다.')
      setRules([])
    } finally {
      setIsRulesLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadRules()
  }, [loadRules])

  const mileageProps = { rules, isRulesLoading, rulesError }

  return (
    <DashboardLayout roleLabel="교사" navItems={NAV_ITEMS} defaultTab="home">
      {(activeTab) => (
        <div
          className="text-sm"
          style={{
            fontFamily: 'var(--font-noto-sans-kr), sans-serif',
            color: 'var(--admin-text-muted)',
          }}
        >
          {activeTab === 'home' && (
            <TeacherHome
              rules={rules}
              isRulesLoading={isRulesLoading}
              rulesError={rulesError}
            />
          )}
          {activeTab === 'mileage-grant' && (
            <SchoolMileageGrant {...mileageProps} />
          )}
          {activeTab === 'mileage-history' && (
            <SchoolMileageHistory {...mileageProps} />
          )}
          {activeTab === 'mileage-student' && (
            <SchoolMileageStudentView />
          )}
          {activeTab === 'mileage-stats' && (
            <SchoolMileageStats />
          )}
          {activeTab === 'mileage-class' && (
            <SchoolMileageClass />
          )}
          {activeTab === 'mileage-rules' && (
            <SchoolMileageRules {...mileageProps} />
          )}
          {activeTab === 'mileage-report' && (
            <SchoolMileageReport />
          )}
        </div>
      )}
    </DashboardLayout>
  )
}

function TeacherHome({
  rules,
  isRulesLoading,
  rulesError,
}: {
  rules: SchoolMileageRuleSummary[]
  isRulesLoading: boolean
  rulesError: string | null
}) {
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
            교사 화면에서는 학생에게 상점과 벌점을 부여하고, 이미 저장된
            학교 상벌점 내역을 검색해 수정하거나 삭제할 수 있습니다.
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
