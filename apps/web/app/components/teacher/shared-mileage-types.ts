export type SharedSchoolCode = 'GBSW' | 'BYMS'
export type SharedMileageType = 'reward' | 'penalty'

export type SharedMileageRuleSummary = {
  id: number
  type: SharedMileageType
  category: string
  name: string
  defaultScore: number
  displayOrder: number
  isActive: boolean
  minScore?: number | null
  maxScore?: number | null
}

export type SharedMileageStudentOption = {
  studentId: string
  name: string
  school?: SharedSchoolCode
  grade: number | null
  classNumber: number
  studentNumber: number
}

export type SharedMileageHistoryItem = {
  id: number
  type: SharedMileageType
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
  school?: SharedSchoolCode
  grade: number | null
  classNumber: number
  studentNumber: number
  teacherId: string
  teacherName: string
}

export type SharedPaginatedMileageHistoryResponse<
  Item extends SharedMileageHistoryItem = SharedMileageHistoryItem,
> = {
  items: Item[]
  page: number
  pageSize: number
  totalCount: number
}

export type SharedCreateMileageEntriesPayload = {
  entries: Array<{
    studentId: string
    ruleId: number
    score: number
    reason?: string
  }>
}

export type SharedUpdateMileageEntryPayload = {
  ruleId?: number
  score?: number
  reason?: string
  awardedAt?: string
}

export type SharedStudentMileageSummary = {
  studentId: string
  name: string
  school?: SharedSchoolCode
  grade: number | null
  classNumber: number
  studentNumber: number
  rewardTotal: number
  penaltyTotal: number
  netScore: number
  entryCount: number
}

export type SharedClassMileageSummary<
  Student extends SharedStudentMileageSummary = SharedStudentMileageSummary,
> = {
  classNumber: number
  studentCount: number
  rewardTotal: number
  penaltyTotal: number
  netScore: number
  avgNetScore: number
  topStudents: Student[]
  bottomStudents: Student[]
}

export type SharedClassMileageAnalyticsOverall = {
  classCount: number
  totalStudents: number
  rewardTotal: number
  penaltyTotal: number
  netScore: number
}

export type SharedClassMileageAnalyticsResponse<
  Summary extends SharedClassMileageSummary = SharedClassMileageSummary,
> = {
  classes: Summary[]
  overall: SharedClassMileageAnalyticsOverall
}

export type SharedStudentMileageAnalyticsResponse<
  Student extends SharedStudentMileageSummary = SharedStudentMileageSummary,
> = {
  students: Student[]
  totalCount: number
}

export type SharedCategoryStat = {
  category: string
  type: SharedMileageType
  count: number
  totalScore: number
}

export type SharedTopRuleStat = {
  ruleId: number
  ruleName: string
  category: string
  type: SharedMileageType
  count: number
  totalScore: number
}

export type SharedMileageOverviewSummary = {
  rewardCount: number
  penaltyCount: number
  rewardSum: number
  penaltySum: number
  uniqueStudents: number
  totalCount: number
}

export type SharedMileageOverviewResponse = {
  summary: SharedMileageOverviewSummary
  categoryStats: SharedCategoryStat[]
  topRules: SharedTopRuleStat[]
}

export type SharedStudentMileageSummaryResponse<
  Summary extends SharedStudentMileageSummary = SharedStudentMileageSummary,
> = {
  summary: Summary
}

export type SharedReportHistoryItem = {
  id: number
  type: SharedMileageType
  score: number
  awardedAt: string
  ruleCategory: string
  ruleName: string
  studentName: string
  classNumber: number
  studentNumber: number
  teacherName: string
}
