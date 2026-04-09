'use client'

import DormRuleFormModal from './DormRuleFormModal'
import SharedMileageRulesView from './SharedMileageRulesView'
import type { DormMileageRuleSummary } from './dorm-mileage-types'

function formatScoreDisplay(rule: DormMileageRuleSummary) {
  const base = `${rule.type === 'reward' ? '+' : '-'}${rule.defaultScore}점`
  if (rule.minScore !== null && rule.maxScore !== null) {
    return `기본: ${rule.defaultScore}점 (범위: ${rule.minScore}~${rule.maxScore})`
  }
  return base
}

export default function DormMileageRules({
  rules,
  isRulesLoading,
  rulesError,
  loadRules,
  readOnly = false,
  apiPath = '/api/teacher/dorm-mileage/rules',
}: {
  rules: DormMileageRuleSummary[]
  isRulesLoading: boolean
  rulesError: string | null
  loadRules: () => Promise<void>
  readOnly?: boolean
  apiPath?: string
}) {
  return (
    <SharedMileageRulesView<DormMileageRuleSummary>
      rules={rules}
      isRulesLoading={isRulesLoading}
      rulesError={rulesError}
      loadRules={loadRules}
      readOnly={readOnly}
      apiPath={apiPath}
      title="기숙사 상벌점 항목"
      readOnlySubtitle="현재 등록된 기숙사 상벌점 규칙 목록입니다."
      editableSubtitle="현재 등록된 기숙사 상벌점 규칙을 관리합니다."
      toggleErrorMessage="기숙사 상벌점 항목 상태를 변경하지 못했습니다."
      toggleCatchMessage="기숙사 상벌점 항목 상태 변경 중 문제가 발생했습니다."
      createSuccessDescription="새 기숙사 상벌점 항목이 추가되었습니다."
      editSuccessDescription="기숙사 상벌점 항목이 수정되었습니다."
      emptyDescription="검색 조건을 변경하거나 새 항목을 추가해 보세요."
      renderFormModal={(props) => <DormRuleFormModal {...props} />}
      formatScoreDisplay={formatScoreDisplay}
    />
  )
}
