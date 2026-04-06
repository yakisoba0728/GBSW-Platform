import type {
  MileageType,
  PaginatedSchoolMileageHistoryResponse as TeacherPaginatedSchoolMileageHistoryResponse,
  SchoolCode,
  SchoolMileageHistoryItem as TeacherSchoolMileageHistoryItem,
  SchoolMileageRuleSummary,
  StudentMileageSummary,
  StudentMileageSummaryResponse,
} from '../teacher/school-mileage-types'

export type {
  MileageType,
  SchoolCode,
  SchoolMileageRuleSummary,
  StudentMileageSummary,
  StudentMileageSummaryResponse,
}

export type SchoolMileageHistoryItem = Omit<
  TeacherSchoolMileageHistoryItem,
  'teacherId'
>

export type PaginatedSchoolMileageHistoryResponse = Omit<
  TeacherPaginatedSchoolMileageHistoryResponse,
  'items'
> & {
  items: SchoolMileageHistoryItem[]
}
