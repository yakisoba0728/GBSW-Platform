export type MileageType = 'reward' | 'penalty'

export type DormMileageRuleSummary = {
  id: number
  type: MileageType
  category: string
  name: string
  defaultScore: number
  minScore: number | null
  maxScore: number | null
  displayOrder: number
  isActive: boolean
}

export type DormMileageStudentOption = {
  studentId: string
  name: string
  grade: number | null
  classNumber: number
  studentNumber: number
}

export type DormMileageHistoryItem = {
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
  grade: number | null
  classNumber: number
  studentNumber: number
  teacherId: string
  teacherName: string
}

export type PaginatedDormMileageHistoryResponse = {
  items: DormMileageHistoryItem[]
  page: number
  pageSize: number
  totalCount: number
}

export type CreateDormMileageEntriesPayload = {
  entries: Array<{
    studentId: string
    ruleId: number
    score: number
    reason?: string
  }>
}

export type UpdateDormMileageEntryPayload = {
  ruleId?: number
  score?: number
  reason?: string
  awardedAt?: string
}

export type DormStudentMileageSummary = {
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

export type DormClassMileageSummary = {
  classNumber: number
  studentCount: number
  rewardTotal: number
  penaltyTotal: number
  netScore: number
  avgNetScore: number
  topStudents: DormStudentMileageSummary[]
  bottomStudents: DormStudentMileageSummary[]
}

export type DormCategoryStat = {
  category: string
  type: MileageType
  count: number
  totalScore: number
}

export type DormTopRuleStat = {
  ruleId: number
  ruleName: string
  category: string
  type: MileageType
  count: number
  totalScore: number
}

export type DormMileageOverviewSummary = {
  rewardCount: number
  penaltyCount: number
  rewardSum: number
  penaltySum: number
  uniqueStudents: number
  totalCount: number
}

export type DormMileageOverviewResponse = {
  summary: DormMileageOverviewSummary
  categoryStats: DormCategoryStat[]
  topRules: DormTopRuleStat[]
}

export type DormStudentMileageAnalyticsResponse = {
  students: DormStudentMileageSummary[]
  totalCount: number
}

export type DormClassMileageAnalyticsOverall = {
  classCount: number
  totalStudents: number
  rewardTotal: number
  penaltyTotal: number
  netScore: number
}

export type DormClassMileageAnalyticsResponse = {
  classes: DormClassMileageSummary[]
  overall: DormClassMileageAnalyticsOverall
}

export type DormStudentMileageSummaryResponse = {
  summary: DormStudentMileageSummary
}
