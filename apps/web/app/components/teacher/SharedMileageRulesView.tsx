'use client'

import { useMemo, useState } from 'react'
import {
  Badge,
  Card,
  FilterRow,
  NoticeBox,
  SectionHeader,
  inputStyle,
} from '../mileage/shared'
import { Button } from '../ui/button'
import { EditIcon, FileIcon, PlusIcon, SearchIcon } from '../ui/icons'
import { AnimatedTableRow, ListEmptyState, TableRowSkeleton } from '../ui/list'
import SuccessModal from '../ui/success-modal'
import { koreanIncludes } from '@/lib/korean-search'
import type {
  SharedMileageRuleSummary,
  SharedMileageType,
} from './shared-mileage-types'

type FormModalRenderProps<Rule extends SharedMileageRuleSummary> = {
  open: boolean
  onClose: () => void
  mode: 'create' | 'edit'
  rule: Rule | null
  categories: string[]
  existingRules: Rule[]
  onSuccess: () => Promise<void>
  apiPath: string
}

type SharedMileageRulesViewProps<Rule extends SharedMileageRuleSummary> = {
  rules: Rule[]
  isRulesLoading: boolean
  rulesError: string | null
  loadRules: () => Promise<void>
  readOnly?: boolean
  apiPath: string
  title: string
  readOnlySubtitle: string
  editableSubtitle: string
  toggleErrorMessage: string
  toggleCatchMessage: string
  createSuccessDescription: string
  editSuccessDescription: string
  emptyDescription: string
  renderFormModal: (props: FormModalRenderProps<Rule>) => React.ReactNode
  formatScoreDisplay?: (rule: Rule) => string
}

function defaultFormatScoreDisplay(rule: SharedMileageRuleSummary) {
  return `${rule.type === 'reward' ? '+' : '-'}${rule.defaultScore}점`
}

export default function SharedMileageRulesView<
  Rule extends SharedMileageRuleSummary,
>({
  rules,
  isRulesLoading,
  rulesError,
  loadRules,
  readOnly = false,
  apiPath,
  title,
  readOnlySubtitle,
  editableSubtitle,
  toggleErrorMessage,
  toggleCatchMessage,
  createSuccessDescription,
  editSuccessDescription,
  emptyDescription,
  renderFormModal,
  formatScoreDisplay = defaultFormatScoreDisplay,
}: SharedMileageRulesViewProps<Rule>) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'' | SharedMileageType>('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [hoveredRowId, setHoveredRowId] = useState<number | null>(null)
  const [toggleRuleId, setToggleRuleId] = useState<number | null>(null)
  const [toggleError, setToggleError] = useState<string | null>(null)
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [editingRule, setEditingRule] = useState<Rule | null>(null)
  const [successMessage, setSuccessMessage] = useState<{
    open: boolean
    title: string
    description?: string
    type: 'success' | 'error'
  }>({ open: false, title: '', type: 'success' })

  const categories = useMemo(
    () => [...new Set(rules.map((rule) => rule.category))].sort(),
    [rules],
  )

  const filteredRules = useMemo(() => {
    return rules.filter((rule) => {
      if (typeFilter && rule.type !== typeFilter) {
        return false
      }
      if (categoryFilter && rule.category !== categoryFilter) {
        return false
      }
      if (
        search &&
        !koreanIncludes(rule.name, search) &&
        !koreanIncludes(rule.category, search)
      ) {
        return false
      }

      return true
    })
  }, [categoryFilter, rules, search, typeFilter])

  function handleCreate() {
    setFormMode('create')
    setEditingRule(null)
    setFormModalOpen(true)
  }

  function handleEdit(rule: Rule) {
    setFormMode('edit')
    setEditingRule(rule)
    setFormModalOpen(true)
  }

  async function handleToggle(rule: Rule) {
    setToggleError(null)
    setToggleRuleId(rule.id)

    try {
      const response = await fetch(`${apiPath}/${rule.id}/toggle`, {
        method: 'PATCH',
      })
      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        setToggleError(payload?.message ?? toggleErrorMessage)
        return
      }

      await loadRules()
    } catch {
      setToggleError(toggleCatchMessage)
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
          ? createSuccessDescription
          : editSuccessDescription,
      type: 'success',
    })
  }

  return (
    <div className="flex flex-col h-full gap-4">
      {renderFormModal({
        open: formModalOpen,
        onClose: () => setFormModalOpen(false),
        mode: formMode,
        rule: editingRule,
        categories,
        existingRules: rules,
        onSuccess: handleFormSuccess,
        apiPath,
      })}

      <SuccessModal
        open={successMessage.open}
        onClose={() =>
          setSuccessMessage({ open: false, title: '', type: 'success' })
        }
        type={successMessage.type}
        title={successMessage.title}
        description={successMessage.description}
      />

      <Card>
        <SectionHeader
          title={title}
          subtitle={readOnly ? readOnlySubtitle : editableSubtitle}
          action={
            readOnly ? undefined : (
              <Button
                variant="accent"
                size="sm"
                icon={<PlusIcon />}
                onClick={handleCreate}
              >
                항목 추가
              </Button>
            )
          }
        />
      </Card>

      {rulesError && <NoticeBox type="error" message={rulesError} />}

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
              onChange={(event) => setSearch(event.target.value)}
              placeholder="항목명 또는 카테고리 검색"
              className="h-8 w-full rounded-md border pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              style={inputStyle}
            />
          </div>

          <select
            value={typeFilter}
            onChange={(event) =>
              setTypeFilter(event.target.value as '' | SharedMileageType)
            }
            className="h-8 rounded-md border bg-transparent px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            style={inputStyle}
          >
            <option value="">전체 유형</option>
            <option value="reward">상점</option>
            <option value="penalty">벌점</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="h-8 rounded-md border bg-transparent px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
            style={inputStyle}
          >
            <option value="">전체 카테고리</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          {(search || typeFilter || categoryFilter) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearch('')
                setTypeFilter('')
                setCategoryFilter('')
              }}
            >
              초기화
            </Button>
          )}
          <span
            className="ml-auto text-xs"
            style={{
              color: 'var(--fg-muted)',
              fontFamily: 'var(--font-space-grotesk)',
            }}
          >
            {filteredRules.length}건
          </span>
        </FilterRow>
      </Card>

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
        <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="table-header">
              <tr>
                {[
                  'ID',
                  '유형',
                  '카테고리',
                  '항목명',
                  '기본점수',
                  '순서',
                  '상태',
                  ...(readOnly ? [] : ['작업']),
                ].map((header) => (
                  <th key={header} className="px-3" scope="col">
                    {header}
                  </th>
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
                        icon={<FileIcon style={{ color: 'var(--accent)' }} />}
                        title="규칙이 없습니다"
                        description={emptyDescription}
                      />
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRules.map((rule, index) => (
                  <AnimatedTableRow
                    key={rule.id}
                    index={index}
                    className="transition-colors"
                    style={{
                      borderBottom: '1px solid var(--border)',
                      backgroundColor:
                        hoveredRowId === rule.id
                          ? 'var(--admin-row-hover)'
                          : 'transparent',
                    }}
                    onMouseEnter={() => setHoveredRowId(rule.id)}
                    onMouseLeave={() => setHoveredRowId(null)}
                  >
                    <td
                      className="px-3 py-2"
                      style={{
                        color: 'var(--fg-muted)',
                        fontFamily: 'var(--font-space-grotesk)',
                      }}
                    >
                      {rule.id}
                    </td>
                    <td className="px-3 py-2">
                      <Badge type={rule.type}>
                        {rule.type === 'reward' ? '상점' : '벌점'}
                      </Badge>
                    </td>
                    <td
                      className="px-3 py-2"
                      style={{
                        color: 'var(--fg-muted)',
                        fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                      }}
                    >
                      {rule.category}
                    </td>
                    <td
                      className="px-3 py-2 font-medium"
                      style={{
                        color: 'var(--fg)',
                        fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                      }}
                    >
                      {rule.name}
                    </td>
                    <td
                      className="px-3 py-2 font-semibold"
                      style={{
                        fontFamily: 'var(--font-space-grotesk)',
                        color:
                          rule.type === 'reward'
                            ? 'var(--reward)'
                            : 'var(--penalty)',
                      }}
                    >
                      {formatScoreDisplay(rule)}
                    </td>
                    <td
                      className="px-3 py-2"
                      style={{
                        color: 'var(--fg-muted)',
                        fontFamily: 'var(--font-space-grotesk)',
                      }}
                    >
                      {rule.displayOrder}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        className="rounded-full px-2 py-0.5 text-[11px] transition-opacity"
                        disabled={readOnly || toggleRuleId === rule.id}
                        onClick={() => void handleToggle(rule)}
                        style={{
                          fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                          backgroundColor: rule.isActive
                            ? 'var(--reward-subtle)'
                            : 'var(--border)',
                          color: rule.isActive
                            ? 'var(--reward)'
                            : 'var(--fg-muted)',
                          opacity:
                            toggleRuleId === rule.id || readOnly ? 0.6 : 1,
                          cursor: readOnly ? 'default' : 'pointer',
                        }}
                      >
                        {toggleRuleId === rule.id
                          ? '변경 중'
                          : rule.isActive
                            ? '사용 중'
                            : '비활성'}
                      </button>
                    </td>
                    {!readOnly && (
                      <td className="px-3 py-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<EditIcon />}
                          onClick={() => handleEdit(rule)}
                        >
                          수정
                        </Button>
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
