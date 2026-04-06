'use client'

import { Card, FilterRow, SectionHeader, inputStyle } from './teacher-shared'
import type { SchoolCode } from './school-mileage-types'

type ReportType = 'student' | 'class' | 'all'

const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  student: '학생별 보고서',
  class: '학급별 보고서',
  all: '전체 내역',
}

export default function ReportFilters({
  reportType,
  filterSchool,
  filterGrade,
  startDate,
  endDate,
  onReportTypeChange,
  onSchoolChange,
  onGradeChange,
  onStartDateChange,
  onEndDateChange,
  onReload,
  onPrint,
  canPrint,
  isLoading,
  schoolOptions,
}: {
  reportType: ReportType
  filterSchool: SchoolCode | ''
  filterGrade: string
  startDate: string
  endDate: string
  onReportTypeChange: (value: ReportType) => void
  onSchoolChange: (value: string) => void
  onGradeChange: (value: string) => void
  onStartDateChange: (value: string) => void
  onEndDateChange: (value: string) => void
  onReload: () => void
  onPrint: () => void
  canPrint: boolean
  isLoading: boolean
  schoolOptions: Array<{ value: SchoolCode; label: string }>
}) {
  return (
    <Card className="no-print">
      <SectionHeader
        title="보고서 출력"
        subtitle="조건을 설정하고 미리보기를 확인한 후 인쇄하세요."
      />

      <div className="mt-5 space-y-4">
        <div>
          <p
            className="mb-2 text-xs font-semibold"
            style={{
              fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              color: 'var(--admin-text-muted)',
            }}
          >
            보고서 유형
          </p>
          <div className="flex gap-3">
            {(['student', 'class', 'all'] as ReportType[]).map((type) => (
              <label
                key={type}
                className="flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs transition-colors"
                style={{
                  fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                  borderColor:
                    reportType === type
                      ? 'var(--admin-accent)'
                      : 'var(--admin-border)',
                  backgroundColor:
                    reportType === type
                      ? 'var(--admin-accent-bg)'
                      : 'transparent',
                  color:
                    reportType === type
                      ? 'var(--admin-accent)'
                      : 'var(--admin-text)',
                }}
              >
                <input
                  type="radio"
                  name="reportType"
                  value={type}
                  checked={reportType === type}
                  onChange={() => onReportTypeChange(type)}
                  className="sr-only"
                />
                {REPORT_TYPE_LABELS[type]}
              </label>
            ))}
          </div>
        </div>

        <div>
          <p
            className="mb-2 text-xs font-semibold"
            style={{
              fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              color: 'var(--admin-text-muted)',
            }}
          >
            조회 조건
          </p>
          <FilterRow>
            <select
              value={filterSchool}
              onChange={(event) => onSchoolChange(event.target.value)}
              className="h-8 rounded-md border bg-transparent px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-accent)]"
              style={inputStyle}
            >
              <option value="">전체 학교</option>
              {schoolOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              value={filterGrade}
              onChange={(event) => onGradeChange(event.target.value)}
              className="h-8 rounded-md border bg-transparent px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-accent)]"
              style={inputStyle}
            >
              <option value="">전체 학년</option>
              <option value="1">1학년</option>
              <option value="2">2학년</option>
              <option value="3">3학년</option>
            </select>

            <input
              type="date"
              value={startDate}
              onChange={(event) => onStartDateChange(event.target.value)}
              className="h-8 rounded-md border bg-transparent px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-accent)]"
              style={inputStyle}
            />
            <span className="text-xs" style={{ color: 'var(--admin-text-muted)' }}>
              ~
            </span>
            <input
              type="date"
              value={endDate}
              onChange={(event) => onEndDateChange(event.target.value)}
              className="h-8 rounded-md border bg-transparent px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-accent)]"
              style={inputStyle}
            />
          </FilterRow>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onReload}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              backgroundColor: 'var(--admin-accent)',
              color: '#fff',
            }}
          >
            {isLoading ? '불러오는 중...' : '새로고침'}
          </button>
          <button
            type="button"
            onClick={onPrint}
            disabled={!canPrint}
            className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              borderColor: 'var(--admin-border)',
              color: 'var(--admin-text)',
              backgroundColor: 'var(--admin-sidebar-bg)',
            }}
          >
            인쇄
          </button>
        </div>
      </div>
    </Card>
  )
}
