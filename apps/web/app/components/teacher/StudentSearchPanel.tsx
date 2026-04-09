'use client'

import {
  Card,
  FilterRow,
  SCHOOL_OPTIONS,
  SectionHeader,
  inputStyle,
} from '../mileage/shared'
import { Button } from '../ui/button'
import type { SchoolCode } from './school-mileage-types'

type Props = {
  filterSchool?: SchoolCode | ''
  filterGrade: string
  filterClass: string
  filterName: string
  onSchoolChange?: (value: string) => void
  onGradeChange: (value: string) => void
  onClassChange: (value: string) => void
  onNameChange: (value: string) => void
  onReload: () => void
  isLoading: boolean
  showSchoolFilter?: boolean
  title?: string
  subtitle?: string
  emptySchoolValueLabel?: string
  disableReload?: boolean
}

export default function StudentSearchPanel({
  filterSchool,
  filterGrade,
  filterClass,
  filterName,
  onSchoolChange,
  onGradeChange,
  onClassChange,
  onNameChange,
  onReload,
  isLoading,
  showSchoolFilter = true,
  title = '학생별 조회',
  subtitle = '학생을 검색하고 선택하면 누적 상벌점 요약과 처리 내역을 확인할 수 있습니다.',
  emptySchoolValueLabel = '학교 선택',
  disableReload = false,
}: Props) {
  return (
    <Card>
      <SectionHeader
        title={title}
        subtitle={subtitle}
      />
      <div className="mt-4">
        <FilterRow>
          {showSchoolFilter && onSchoolChange && (
            <select
              value={filterSchool ?? ''}
              onChange={(event) => onSchoolChange(event.target.value)}
              className="rounded-lg border px-3 py-2 text-xs outline-none"
              style={inputStyle}
            >
              <option value="">{emptySchoolValueLabel}</option>
              {SCHOOL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          )}

          <select
            value={filterGrade}
            onChange={(event) => onGradeChange(event.target.value)}
            className="rounded-lg border px-3 py-2 text-xs outline-none"
            style={inputStyle}
          >
            <option value="">전체 학년</option>
            <option value="1">1학년</option>
            <option value="2">2학년</option>
            <option value="3">3학년</option>
          </select>

          <select
            value={filterClass}
            onChange={(event) => onClassChange(event.target.value)}
            className="rounded-lg border px-3 py-2 text-xs outline-none"
            style={inputStyle}
          >
            <option value="">전체 반</option>
            {[1, 2, 3, 4, 5, 6].map((classNumber) => (
              <option key={classNumber} value={String(classNumber)}>
                {classNumber}반
              </option>
            ))}
          </select>

          <input
            type="text"
            value={filterName}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="학생 이름 검색"
            className="rounded-lg border px-3 py-2 text-xs outline-none"
            style={{ ...inputStyle, minWidth: '120px' }}
          />

          <Button
            variant="primary"
            size="sm"
            loading={isLoading}
            disabled={disableReload || isLoading}
            onClick={onReload}
          >
            새로고침
          </Button>
        </FilterRow>
      </div>
    </Card>
  )
}
