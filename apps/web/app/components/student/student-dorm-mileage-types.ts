import type {
  DormMileageHistoryItem as TeacherDormMileageHistoryItem,
  DormMileageRuleSummary,
  PaginatedDormMileageHistoryResponse as TeacherPaginatedDormMileageHistoryResponse,
} from '../teacher/dorm-mileage-types'

export type { DormMileageRuleSummary }

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

export type StudentDormMileageSummary = {
  studentId: string
  name: string
  grade: number | null
  classNumber: number
  studentNumber: number
  rewardTotal: number
  penaltyTotal: number
  netScore: number
  entryCount: number
}

export type StudentDormMileageSummaryResponse = {
  summary: StudentDormMileageSummary
}
