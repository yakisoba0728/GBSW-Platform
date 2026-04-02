export type SchoolCode = 'GBSW' | 'BYMS'
export type MileageType = 'reward' | 'penalty'

export type SchoolMileageRuleSummary = {
  id: number
  type: MileageType
  category: string
  name: string
  defaultScore: number
  displayOrder: number
  isActive: boolean
}

export type SchoolMileageStudentOption = {
  studentId: string
  name: string
  school: SchoolCode
  grade: number | null
  classNumber: number
  studentNumber: number
}

export type SchoolMileageHistoryItem = {
  id: number
  type: MileageType
  score: number
  reason: string | null
  awardedAt: string
  createdAt: string
  updatedAt: string
  ruleId: number
  ruleCategory: string
  ruleName: string
  ruleDefaultScore: number
  studentId: string
  studentName: string
  school: SchoolCode
  grade: number | null
  classNumber: number
  studentNumber: number
  teacherId: string
  teacherName: string
}

export type PaginatedSchoolMileageHistoryResponse = {
  items: SchoolMileageHistoryItem[]
  page: number
  pageSize: number
  totalCount: number
}

export type CreateSchoolMileageEntriesPayload = {
  entries: Array<{
    studentId: string
    ruleId: number
    score: number
    reason?: string
  }>
}

export type UpdateSchoolMileageEntryPayload = {
  ruleId?: number
  score?: number
  reason?: string
  awardedAt?: string
}

export type StudentMileageSummary = {
  studentId: string
  name: string
  school: SchoolCode
  grade: number | null
  classNumber: number
  studentNumber: number
  rewardTotal: number
  penaltyTotal: number
  netScore: number
  entryCount: number
}

export type ClassMileageSummary = {
  classNumber: number
  studentCount: number
  rewardTotal: number
  penaltyTotal: number
  netScore: number
  avgNetScore: number
  topStudents: StudentMileageSummary[]
  bottomStudents: StudentMileageSummary[]
}

export type CategoryStat = {
  category: string
  type: MileageType
  count: number
  totalScore: number
}
