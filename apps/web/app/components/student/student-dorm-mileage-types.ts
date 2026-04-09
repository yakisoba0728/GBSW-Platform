import type {
  DormMileageHistoryItem as TeacherDormMileageHistoryItem,
  DormMileageRuleSummary,
  DormStudentMileageSummary as TeacherDormStudentMileageSummary,
  DormStudentMileageSummaryResponse as TeacherDormStudentMileageSummaryResponse,
  PaginatedDormMileageHistoryResponse as TeacherPaginatedDormMileageHistoryResponse,
} from '../teacher/dorm-mileage-types'

export type {
  DormMileageRuleSummary,
  TeacherDormStudentMileageSummary as StudentDormMileageSummary,
  TeacherDormStudentMileageSummaryResponse as StudentDormMileageSummaryResponse,
}

export type StudentDormMileageHistoryItem = Omit<
  TeacherDormMileageHistoryItem,
  'teacherId'
>

export type PaginatedStudentDormMileageHistoryResponse = Omit<
  TeacherPaginatedDormMileageHistoryResponse,
  'items'
> & {
  items: StudentDormMileageHistoryItem[]
}
