'use client'

import { useMemo, useState } from 'react'
import {
  Badge,
  Card,
  FilterRow,
  SectionHeader,
  NoticeBox,
  inputStyle,
} from '../mileage/shared'
import SuccessModal from '../ui/success-modal'
import { AnimatedTableRow, ListEmptyState, TableRowSkeleton } from '../ui/list'
import { Button } from '../ui/button'
import { EditIcon, FileIcon, PlusIcon, SearchIcon } from '../ui/icons'
import RuleFormModal from './RuleFormModal'
import type { MileageType, SchoolMileageRuleSummary } from './school-mileage-types'
import { koreanIncludes } from '@/lib/korean-search'

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
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'' | MileageType>('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [hoveredRowId, setHoveredRowId] = useState<number | null>(null)
  const [toggleRuleId, setToggleRuleId] = useState<number | null>(null)
  const [toggleError, setToggleError] = useState<string | null>(null)

  const [formModalOpen, setFormModalOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [editingRule, setEditingRule] = useState<SchoolMileageRuleSummary | null>(null)
  const [successMessage, setSuccessMessage] = useState<{
    open: boolean
    title: string
    description?: string
    type: 'success' | 'error'
  }>({ open: false, title: '', type: 'success' })

  const categories = useMemo(
    () => [...new Set(rules.map((r) => r.category))].sort(),
    [rules],
  )

  const filteredRules = useMemo(() => {
    return rules.filter((r) => {
      if (typeFilter && r.type !== typeFilter) return false
      if (categoryFilter && r.category !== categoryFilter) return false
      if (
        search &&
        !koreanIncludes(r.name, search) &&
        !koreanIncludes(r.category, search)
      )
        return false
      return true
    })
  }, [rules, typeFilter, categoryFilter, search])

  function handleCreate() {
    setFormMode('create')
    setEditingRule(null)
    setFormModalOpen(true)
  }

  function handleEdit(rule: SchoolMileageRuleSummary) {
    setFormMode('edit')
    setEditingRule(rule)
    setFormModalOpen(true)
  }

  async function handleToggle(rule: SchoolMileageRuleSummary) {
    setToggleError(null)
    setToggleRuleId(rule.id)

    try {
      const response = await fetch(`${apiPath}/${rule.id}/toggle`, {
        method: 'PATCH',
      })
      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        setToggleError(
          payload?.message ?? '상벌점 항목 상태를 변경하지 못했습니다.',
        )
        return
      }

      await loadRules()
    } catch {
      setToggleError('상벌점 항목 상태 변경 중 문제가 발생했습니다.')
    } finally {
      setToggleRuleId(null)
    }
  }

  async function handleFormSuccess() {
    await loadRules()
    setSuccessMessage({
      open: true,
      title: formMode === 'create' ? '항목 추가 완료' : '항목 수정 완료',
      description:
        formMode === 'create'
          ? '새 상벌점 항목이 추가되었습니다.'
          : '상벌점 항목이 수정되었습니다.',
      type: 'success',
    })
  }

  return (
    <div className="flex flex-col h-full gap-4">
      <RuleFormModal
        open={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        mode={formMode}
        rule={editingRule}
        categories={categories}
        existingRules={rules}
        onSuccess={handleFormSuccess}
        apiPath={apiPath}
      />

      <SuccessModal
        open={successMessage.open}
        onClose={() => setSuccessMessage({ open: false, title: '', type: 'success' })}
        type={successMessage.type}
        title={successMessage.title}
        description={successMessage.description}
      />

      <Card>
        <SectionHeader
          title="상벌점 항목"
          subtitle={readOnly ? '현재 등록된 상벌점 규칙 목록입니다.' : '현재 등록된 상벌점 규칙을 관리합니다.'}
          action={
            readOnly ? undefined : (
              <Button variant="accent" size="sm" icon={<PlusIcon />} onClick={handleCreate}>항목 추가</Button>
            )
          }
        />
      </Card>

      {rulesError && (
        <NoticeBox type="error" message={rulesError} />
      )}

      {toggleError && (
        <NoticeBox
          type="error"
          message={toggleError}
          onDismiss={() => setToggleError(null)}
        />
      )}

      <Card>
        <FilterRow>
          <div className="relative flex-1" style={{ minWidth: '160px' }}>
            <SearchIcon
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--fg-muted)' }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="항목명 또는 카테고리 검색"
              className="h-8 w-full rounded-md border pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              style={inputStyle}
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as '' | MileageType)}
            className="h-8 rounded-md border bg-transparent px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            style={inputStyle}
          >
            <option value="">전체 유형</option>
            <option value="reward">상점</option>
            <option value="penalty">벌점</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-8 rounded-md border bg-transparent px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            style={inputStyle}
          >
            <option value="">전체 카테고리</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {(search || typeFilter || categoryFilter) && (
            <Button variant="ghost" size="sm" onClick={() => { setSearch(''); setTypeFilter(''); setCategoryFilter('') }}>초기화</Button>
          )}
          <span className="ml-auto text-xs" style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-space-grotesk)' }}>
            {filteredRules.length}건
          </span>
        </FilterRow>
      </Card>

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
        <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="table-header">
              <tr>
                {['ID', '유형', '카테고리', '항목명', '기본점수', '순서', '상태', ...(readOnly ? [] : ['작업'])].map((h) => (
                  <th key={h} className="px-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isRulesLoading ? (
                <TableRowSkeleton columns={readOnly ? 7 : 8} count={6} />
              ) : rulesError ? (
                <tr>
                  <td colSpan={readOnly ? 7 : 8} className="p-0">
                    <div className="flex min-h-[320px] items-center justify-center p-4">
                      <NoticeBox type="error" message={rulesError} />
                    </div>
                  </td>
                </tr>
              ) : filteredRules.length === 0 ? (
                <tr>
                  <td colSpan={readOnly ? 7 : 8} className="p-0">
                    <div className="flex min-h-[320px]">
                      <ListEmptyState
                        fill
                        icon={
                          <FileIcon
                            style={{ color: 'var(--accent)' }}
                          />
                        }
                        title="규칙이 없습니다"
                        description="검색 조건을 변경하거나 새 항목을 추가해 보세요."
                      />
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRules.map((rule, i) => (
                  <AnimatedTableRow
                    key={rule.id}
                    index={i}
                    className="transition-colors"
                    style={{
                      borderBottom: '1px solid var(--border)',
                      backgroundColor:
                        hoveredRowId === rule.id
                          ? 'var(--accent-subtle)'
                          : 'transparent',
                      opacity: rule.isActive ? 1 : 0.7,
                    }}
                    onMouseEnter={() => setHoveredRowId(rule.id)}
                    onMouseLeave={() => setHoveredRowId(null)}
                  >
                    <td className="px-3 py-2" style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-space-grotesk)' }}>
                      {rule.id}
                    </td>
                    <td className="px-3 py-2">
                      <Badge type={rule.type}>{rule.type === 'reward' ? '상점' : '벌점'}</Badge>
                    </td>
                    <td className="px-3 py-2" style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
                      {rule.category}
                    </td>
                    <td className="px-3 py-3 font-medium" style={{ color: 'var(--fg)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
                      {rule.name}
                    </td>
                    <td className="px-3 py-2 font-semibold" style={{ fontFamily: 'var(--font-space-grotesk)', color: rule.type === 'reward' ? 'var(--reward)' : 'var(--penalty)' }}>
                      {rule.type === 'reward' ? '+' : '-'}{rule.defaultScore}점
                    </td>
                    <td className="px-3 py-2" style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-space-grotesk)' }}>
                      {rule.displayOrder}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                        style={{
                          fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                          backgroundColor: rule.isActive
                            ? 'rgba(34,197,94,0.12)'
                            : 'rgba(148,163,184,0.18)',
                          color: rule.isActive ? '#15803d' : 'var(--fg-muted)',
                        }}
                      >
                        {rule.isActive ? '활성' : '비활성'}
                      </span>
                    </td>
                    {!readOnly && (
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5 transition-opacity" style={{ opacity: hoveredRowId === rule.id ? 1 : 0 }}>
                          <Button
                            variant="secondary"
                            size="sm"
                            icon={<EditIcon />}
                            onClick={() => handleEdit(rule)}
                          >
                            수정
                          </Button>
                          <Button
                            variant={rule.isActive ? 'ghost' : 'accent'}
                            size="sm"
                            loading={toggleRuleId === rule.id}
                            disabled={toggleRuleId === rule.id}
                            onClick={() => void handleToggle(rule)}
                          >
                            {rule.isActive ? '비활성화' : '활성화'}
                          </Button>
                        </div>
                      </td>
                    )}
                  </AnimatedTableRow>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
