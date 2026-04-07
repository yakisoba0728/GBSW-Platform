'use client'

import { RefreshCw, Printer, Download } from 'lucide-react'
import { Button } from '../ui/button'
import { UsersIcon } from '../ui/icons'
import { Card, FilterRow, SectionHeader, inputStyle } from '../mileage/shared'

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
  selectedStudentIds,
  onReportTypeChange,
  onSchoolChange,
  onGradeChange,
  onStartDateChange,
  onEndDateChange,
  onStudentIdsChange,
  onOpenStudentModal,
  onReload,
  onPrint,
  onExport,
  canPrint,
  canExport,
  isLoading,
  schoolOptions,
  showSchoolFilter = true,
}: {
  reportType: ReportType
  filterSchool: string
  filterGrade: string
  startDate: string
  endDate: string
  selectedStudentIds: string[]
  onReportTypeChange: (value: ReportType) => void
  onSchoolChange: (value: string) => void
  onGradeChange: (value: string) => void
  onStartDateChange: (value: string) => void
  onEndDateChange: (value: string) => void
  onStudentIdsChange: (ids: string[]) => void
  onOpenStudentModal: () => void
  onReload: () => void
  onPrint: () => void
  onExport: () => void
  canPrint: boolean
  canExport: boolean
  isLoading: boolean
  schoolOptions?: Array<{ value: string; label: string }>
  showSchoolFilter?: boolean
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
              color: 'var(--fg-muted)',
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
                      ? 'var(--accent)'
                      : 'var(--border)',
                  backgroundColor:
                    reportType === type
                      ? 'var(--accent-subtle)'
                      : 'transparent',
                  color:
                    reportType === type
                      ? 'var(--accent)'
                      : 'var(--fg)',
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
              color: 'var(--fg-muted)',
            }}
          >
            조회 조건
          </p>
          <FilterRow>
            {showSchoolFilter && (schoolOptions?.length ?? 0) > 0 && (
              <select
                value={filterSchool}
                onChange={(event) => onSchoolChange(event.target.value)}
                className="h-8 rounded-md border bg-transparent px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                style={inputStyle}
              >
                <option value="">전체 학교</option>
                {schoolOptions?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}

            <select
              value={filterGrade}
              onChange={(event) => onGradeChange(event.target.value)}
              className="h-8 rounded-md border bg-transparent px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
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
              className="h-8 rounded-md border bg-transparent px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              style={inputStyle}
            />
            <span className="text-xs" style={{ color: 'var(--fg-muted)' }}>
              ~
            </span>
            <input
              type="date"
              value={endDate}
              onChange={(event) => onEndDateChange(event.target.value)}
              className="h-8 rounded-md border bg-transparent px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
              style={inputStyle}
            />

            {reportType === 'student' && (
              <Button
                variant="accent"
                size="sm"
                icon={<UsersIcon size={12} />}
                onClick={onOpenStudentModal}
              >
                {selectedStudentIds.length > 0
                  ? `학생 ${selectedStudentIds.length}명 선택됨`
                  : '학생 선택'}
              </Button>
            )}
            {reportType === 'student' && selectedStudentIds.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onStudentIdsChange([])}
              >
                선택 초기화
              </Button>
            )}
          </FilterRow>
        </div>

        <div className="flex gap-2">
          <Button variant="primary" size="sm" loading={isLoading} disabled={isLoading} icon={<RefreshCw size={12} aria-hidden="true" />} onClick={onReload}>
            {isLoading ? '불러오는 중...' : '새로고침'}
          </Button>
          <Button variant="secondary" size="sm" disabled={!canPrint} icon={<Printer size={12} aria-hidden="true" />} onClick={onPrint}>
            인쇄
          </Button>
          <Button variant="secondary" size="sm" disabled={!canExport} icon={<Download size={12} aria-hidden="true" />} onClick={onExport}>
            엑셀 내보내기
          </Button>
        </div>
      </div>
    </Card>
  )
}
