'use client'

import SharedHistoryFilters from './SharedHistoryFilters'

type DormHistoryFilters = {
  type: string
  year: string
  startDate: string
  endDate: string
  studentName: string
}

export default function DormHistoryFilters({
  filters,
  hasActiveFilters,
  onChange,
  onReset,
}: {
  filters: DormHistoryFilters
  hasActiveFilters: boolean
  onChange: <K extends keyof DormHistoryFilters>(key: K, value: DormHistoryFilters[K]) => void
  onReset: () => void
}) {
  return (
    <SharedHistoryFilters
      filters={filters}
      hasActiveFilters={hasActiveFilters}
      onTypeChange={(value) => onChange('type', value)}
      onYearChange={(value) => onChange('year', value)}
      onStartDateChange={(value) => onChange('startDate', value)}
      onEndDateChange={(value) => onChange('endDate', value)}
      onStudentNameChange={(value) => onChange('studentName', value)}
      onReset={onReset}
    />
  )
}
