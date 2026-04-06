'use client'

import { useMemo, useState } from 'react'
import {
  Badge,
  Card,
  FilterRow,
  NoticeBox,
  SectionHeader,
  inputStyle,
} from './teacher-shared'
import { AlertModal } from '../ui/modal'
import { AnimatedTableRow, ListEmptyState, TableRowSkeleton } from '../ui/list'
import { EditIcon, FileIcon, PlusIcon, SearchIcon, SlashIcon } from '../ui/icons'
import type { MileageType, SchoolMileageRuleSummary } from './school-mileage-types'
import { koreanIncludes } from '@/lib/korean-search'

export default function SchoolMileageRules({
  rules,
  isRulesLoading,
  rulesError,
}: {
  rules: SchoolMileageRuleSummary[]
  isRulesLoading: boolean
  rulesError: string | null
}) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'' | MileageType>('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [hoveredRowId, setHoveredRowId] = useState<number | null>(null)
  const [alertOpen, setAlertOpen] = useState(false)

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

  return (
    <div className="flex flex-col h-full gap-4">
      <Card>
        <SectionHeader
          title="상벌점 항목 관리"
          subtitle="현재 등록된 상벌점 규칙을 확인합니다. 항목 추가·수정·비활성화 기능은 준비 중입니다."
          action={
            <button
              type="button"
              onClick={() => setAlertOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-70"
              style={{
                fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                backgroundColor: 'var(--admin-accent-bg)',
                borderColor: 'var(--admin-accent)',
                color: 'var(--admin-accent)',
              }}
            >
              <PlusIcon />
              항목 추가
            </button>
          }
        />
      </Card>

      {rulesError && (
        <NoticeBox type="error" message={rulesError} />
      )}

      <Card>
        <FilterRow>
          <div className="relative flex-1" style={{ minWidth: '160px' }}>
            <SearchIcon
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--admin-text-muted)' }}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="항목명 또는 카테고리 검색"
              className="w-full rounded-lg border py-2 pl-8 pr-3 text-xs outline-none"
              style={inputStyle}
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as '' | MileageType)}
            className="rounded-lg border px-3 py-2 text-xs outline-none"
            style={inputStyle}
          >
            <option value="">전체 유형</option>
            <option value="reward">상점</option>
            <option value="penalty">벌점</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-lg border px-3 py-2 text-xs outline-none"
            style={inputStyle}
          >
            <option value="">전체 카테고리</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {(search || typeFilter || categoryFilter) && (
            <button
              type="button"
              onClick={() => { setSearch(''); setTypeFilter(''); setCategoryFilter('') }}
              className="rounded-lg border px-3 py-2 text-xs transition-opacity hover:opacity-70"
              style={{
                fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                borderColor: 'var(--admin-border)',
                color: 'var(--admin-text-muted)',
              }}
            >
              초기화
            </button>
          )}

          <span
            className="ml-auto text-xs"
            style={{ color: 'var(--admin-text-muted)', fontFamily: 'var(--font-space-grotesk)' }}
          >
            {filteredRules.length}건
          </span>
        </FilterRow>
      </Card>

      <Card className="overflow-hidden p-0 flex flex-col flex-1 min-h-0">
        <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--admin-border)', backgroundColor: 'var(--admin-bg)' }}>
                {['ID', '유형', '카테고리', '항목명', '기본점수', '순서', '상태', ''].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-3 text-left font-semibold"
                    style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text-muted)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isRulesLoading ? (
                <TableRowSkeleton columns={8} count={6} />
              ) : filteredRules.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <ListEmptyState
                      icon={
                        <FileIcon
                          style={{ color: 'var(--admin-accent)' }}
                        />
                      }
                      title="규칙이 없습니다"
                      description="검색 조건을 변경하거나 새 항목을 추가해 보세요."
                    />
                  </td>
                </tr>
              ) : (
                filteredRules.map((rule, i) => (
                  <AnimatedTableRow
                    key={rule.id}
                    index={i}
                    className="transition-colors"
                    style={{
                      borderBottom: '1px solid var(--admin-border)',
                      backgroundColor:
                        hoveredRowId === rule.id
                          ? 'var(--admin-accent-bg)'
                          : 'transparent',
                    }}
                    onMouseEnter={() => setHoveredRowId(rule.id)}
                    onMouseLeave={() => setHoveredRowId(null)}
                  >
                    <td className="px-3 py-3" style={{ color: 'var(--admin-text-muted)', fontFamily: 'var(--font-space-grotesk)' }}>
                      {rule.id}
                    </td>
                    <td className="px-3 py-3">
                      <Badge type={rule.type}>{rule.type === 'reward' ? '상점' : '벌점'}</Badge>
                    </td>
                    <td className="px-3 py-3" style={{ color: 'var(--admin-text-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
                      {rule.category}
                    </td>
                    <td className="px-3 py-3 font-medium" style={{ color: 'var(--admin-text)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
                      {rule.name}
                    </td>
                    <td className="px-3 py-3 font-semibold" style={{
                      fontFamily: 'var(--font-space-grotesk)',
                      color: rule.type === 'reward' ? '#16a34a' : '#dc2626',
                    }}>
                      {rule.type === 'reward' ? '+' : '-'}{rule.defaultScore}점
                    </td>
                    <td className="px-3 py-3" style={{ color: 'var(--admin-text-muted)', fontFamily: 'var(--font-space-grotesk)' }}>
                      {rule.displayOrder}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
                        style={{
                          backgroundColor: rule.isActive ? 'rgba(34,197,94,0.1)' : 'rgba(156,163,175,0.15)',
                          color: rule.isActive ? '#16a34a' : '#6b7280',
                        }}
                      >
                        {rule.isActive ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div
                        className="flex items-center gap-1.5 transition-opacity"
                        style={{ opacity: hoveredRowId === rule.id ? 1 : 0 }}
                      >
                        <button
                          type="button"
                          onClick={() => setAlertOpen(true)}
                          className="flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] transition-opacity hover:opacity-70"
                          style={{
                            fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                            borderColor: 'var(--admin-border)',
                            color: 'var(--admin-text-muted)',
                          }}
                        >
                          <EditIcon />수정
                        </button>
                        <button
                          type="button"
                          onClick={() => setAlertOpen(true)}
                          className="flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] transition-opacity hover:opacity-70"
                          style={{
                            fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                            borderColor: 'rgba(239,68,68,0.3)',
                            color: '#dc2626',
                          }}
                        >
                          <SlashIcon />비활성화
                        </button>
                      </div>
                    </td>
                  </AnimatedTableRow>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <AlertModal
        isOpen={alertOpen}
        type="info"
        title="준비 중입니다"
        message="이 기능은 아직 구현되지 않았습니다. 이후 업데이트에서 추가될 예정입니다."
        onClose={() => setAlertOpen(false)}
      />
    </div>
  )
}
