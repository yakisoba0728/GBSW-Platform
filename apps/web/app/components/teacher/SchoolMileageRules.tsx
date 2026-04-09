'use client'

import SharedRuleFormModal from './SharedRuleFormModal'
import SharedMileageRulesView from './SharedMileageRulesView'
import type { SchoolMileageRuleSummary } from './school-mileage-types'

export default function SchoolMileageRules({
  rules,
  isRulesLoading,
  rulesError,
  loadRules,
  readOnly = false,
  apiPath = '/api/teacher/school-mileage/rules',
}: {
  rules: SchoolMileageRuleSummary[]
  isRulesLoading: boolean
  rulesError: string | null
  loadRules: () => Promise<void>
  readOnly?: boolean
  apiPath?: string
}) {
  return (
    <SharedMileageRulesView<SchoolMileageRuleSummary>
      rules={rules}
      isRulesLoading={isRulesLoading}
      rulesError={rulesError}
      loadRules={loadRules}
      readOnly={readOnly}
      apiPath={apiPath}
      title="상벌점 항목"
      readOnlySubtitle="현재 등록된 상벌점 규칙 목록입니다."
      editableSubtitle="현재 등록된 상벌점 규칙을 관리합니다."
      toggleErrorMessage="상벌점 항목 상태를 변경하지 못했습니다."
      toggleCatchMessage="상벌점 항목 상태 변경 중 문제가 발생했습니다."
      createSuccessDescription="새 상벌점 항목이 추가되었습니다."
      editSuccessDescription="상벌점 항목이 수정되었습니다."
      emptyDescription="검색 조건을 변경하거나 새 항목을 추가해 보세요."
      renderFormModal={(props) => (
        <SharedRuleFormModal<SchoolMileageRuleSummary>
          {...props}
          apiPath={props.apiPath ?? '/api/teacher/school-mileage/rules'}
          datalistId="rule-category-list"
        />
      )}
    />
  )
}
