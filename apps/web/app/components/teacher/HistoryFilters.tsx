'use client'

import SharedHistoryFilters from './SharedHistoryFilters'

type HistoryFilters = {
  school: string
  type: string
  year: string
  startDate: string
  endDate: string
  studentName: string
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
    <SharedHistoryFilters
      filters={filters}
      hasActiveFilters={hasActiveFilters}
      hasSchoolFilter
      onSchoolChange={(value) => onChange('school', value)}
      onTypeChange={(value) => onChange('type', value)}
      onYearChange={(value) => onChange('year', value)}
      onStartDateChange={(value) => onChange('startDate', value)}
      onEndDateChange={(value) => onChange('endDate', value)}
      onStudentNameChange={(value) => onChange('studentName', value)}
      onReset={onReset}
    />
  )
}
