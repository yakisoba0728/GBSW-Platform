import type {
  SharedCategoryStat,
  SharedClassMileageAnalyticsOverall,
  SharedClassMileageAnalyticsResponse,
  SharedClassMileageSummary,
  SharedCreateMileageEntriesPayload,
  SharedMileageHistoryItem,
  SharedMileageOverviewResponse,
  SharedMileageOverviewSummary,
  SharedMileageRuleSummary,
  SharedMileageStudentOption,
  SharedMileageType,
  SharedPaginatedMileageHistoryResponse,
  SharedSchoolCode,
  SharedStudentMileageAnalyticsResponse,
  SharedStudentMileageSummary,
  SharedStudentMileageSummaryResponse,
  SharedTopRuleStat,
  SharedUpdateMileageEntryPayload,
} from './shared-mileage-types'

export type SchoolCode = SharedSchoolCode
export type MileageType = SharedMileageType

export type SchoolMileageRuleSummary = Omit<
  SharedMileageRuleSummary,
  'minScore' | 'maxScore'
>

export type SchoolMileageStudentOption = Omit<
  SharedMileageStudentOption,
  'school'
> & {
  school: SchoolCode
}

export type SchoolMileageHistoryItem = Omit<
  SharedMileageHistoryItem,
  'school'
> & {
  school: SchoolCode
}

export type PaginatedSchoolMileageHistoryResponse =
  SharedPaginatedMileageHistoryResponse<SchoolMileageHistoryItem>

export type CreateSchoolMileageEntriesPayload = SharedCreateMileageEntriesPayload

export type UpdateSchoolMileageEntryPayload = SharedUpdateMileageEntryPayload

export type StudentMileageSummary = Omit<SharedStudentMileageSummary, 'school'> & {
  school: SchoolCode
}

export type ClassMileageSummary = SharedClassMileageSummary<StudentMileageSummary>

export type CategoryStat = SharedCategoryStat

export type TopRuleStat = SharedTopRuleStat

export type SchoolMileageOverviewSummary = SharedMileageOverviewSummary

export type SchoolMileageOverviewResponse = SharedMileageOverviewResponse

export type StudentMileageAnalyticsResponse =
  SharedStudentMileageAnalyticsResponse<StudentMileageSummary>

export type ClassMileageAnalyticsOverall = SharedClassMileageAnalyticsOverall

export type ClassMileageAnalyticsResponse =
  SharedClassMileageAnalyticsResponse<ClassMileageSummary>

export type StudentMileageSummaryResponse =
  SharedStudentMileageSummaryResponse<StudentMileageSummary>
