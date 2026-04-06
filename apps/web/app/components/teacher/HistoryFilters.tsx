'use client'

import { Card, SCHOOL_OPTIONS, inputStyle } from './teacher-shared'

type HistoryFilters = {
  school: string
  type: string
  year: string
  startDate: string
  endDate: string
  studentName: string
}

function activeInputStyle(active: boolean) {
  return active
    ? { ...inputStyle, borderColor: 'var(--admin-accent)' }
    : inputStyle
}

export default function HistoryFilters({
  filters,
  hasActiveFilters,
  onChange,
  onReset,
}: {
  filters: HistoryFilters
  hasActiveFilters: boolean
  onChange: <K extends keyof HistoryFilters>(key: K, value: HistoryFilters[K]) => void
  onReset: () => void
}) {
  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-shrink-0 items-center gap-1.5">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            style={{ color: 'var(--admin-text-muted)' }}
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <span
            className="text-xs font-semibold"
            style={{
              fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              color: 'var(--admin-text-muted)',
            }}
          >
            필터
          </span>
        </div>
        <div
          className="h-4 w-px flex-shrink-0"
          style={{ backgroundColor: 'var(--admin-border)' }}
        />

        <select
          value={filters.school}
          onChange={(event) => onChange('school', event.target.value)}
          className="h-8 rounded-md border pl-2.5 pr-6 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-accent)]"
          style={activeInputStyle(!!filters.school)}
        >
          <option value="">전체 학교</option>
          {SCHOOL_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <select
          value={filters.type}
          onChange={(event) => onChange('type', event.target.value)}
          className="h-8 rounded-md border pl-2.5 pr-6 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-accent)]"
          style={activeInputStyle(!!filters.type)}
        >
          <option value="">전체 구분</option>
          <option value="reward">상점</option>
          <option value="penalty">벌점</option>
        </select>

        <select
          value={filters.year}
          onChange={(event) => onChange('year', event.target.value)}
          className="h-8 rounded-md border pl-2.5 pr-6 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-accent)]"
          style={activeInputStyle(!!filters.year)}
        >
          <option value="">전체 학년</option>
          <option value="1">1학년</option>
          <option value="2">2학년</option>
          <option value="3">3학년</option>
        </select>

        <div
          className="flex h-8 items-center gap-1.5 rounded-md border px-2.5"
          style={activeInputStyle(!!(filters.startDate || filters.endDate))}
        >
          <input
            type="date"
            value={filters.startDate}
            onChange={(event) => onChange('startDate', event.target.value)}
            className="bg-transparent py-1.5 text-xs outline-none"
            style={{
              color: 'var(--admin-text)',
              fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              minWidth: 0,
              width: '112px',
            }}
          />
          <span
            style={{
              color: 'var(--admin-text-muted)',
              fontSize: '0.7rem',
              flexShrink: 0,
            }}
          >
            ~
          </span>
          <input
            type="date"
            value={filters.endDate}
            onChange={(event) => onChange('endDate', event.target.value)}
            className="bg-transparent py-1.5 text-xs outline-none"
            style={{
              color: 'var(--admin-text)',
              fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              minWidth: 0,
              width: '112px',
            }}
          />
        </div>

        <input
          type="text"
          value={filters.studentName}
          onChange={(event) => onChange('studentName', event.target.value)}
          placeholder="학생 이름"
          className="h-8 rounded-md border px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-accent)]"
          style={{ ...activeInputStyle(!!filters.studentName), width: '100px' }}
        />

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="ml-auto rounded-md border px-2 py-1 text-[11px] font-medium transition-opacity hover:opacity-70"
            style={{
              borderColor: 'var(--admin-accent)',
              color: 'var(--admin-accent)',
              fontFamily: 'var(--font-noto-sans-kr), sans-serif',
            }}
          >
            초기화
          </button>
        )}
      </div>
    </Card>
  )
}
