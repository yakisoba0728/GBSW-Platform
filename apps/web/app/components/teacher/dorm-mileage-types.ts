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
  SharedStudentMileageAnalyticsResponse,
  SharedStudentMileageSummary,
  SharedStudentMileageSummaryResponse,
  SharedTopRuleStat,
  SharedUpdateMileageEntryPayload,
} from './shared-mileage-types'

export type MileageType = SharedMileageType

export type DormMileageRuleSummary = Omit<
  SharedMileageRuleSummary,
  'minScore' | 'maxScore'
> & {
  minScore: number | null
  maxScore: number | null
}

export type DormMileageStudentOption = Omit<SharedMileageStudentOption, 'school'>

export type DormMileageHistoryItem = Omit<SharedMileageHistoryItem, 'school'>

export type PaginatedDormMileageHistoryResponse =
  SharedPaginatedMileageHistoryResponse<DormMileageHistoryItem>

export type CreateDormMileageEntriesPayload = SharedCreateMileageEntriesPayload

export type UpdateDormMileageEntryPayload = SharedUpdateMileageEntryPayload

export type DormStudentMileageSummary = Omit<SharedStudentMileageSummary, 'school'>

export type DormClassMileageSummary =
  SharedClassMileageSummary<DormStudentMileageSummary>

export type DormCategoryStat = SharedCategoryStat

export type DormTopRuleStat = SharedTopRuleStat

export type DormMileageOverviewSummary = SharedMileageOverviewSummary

export type DormMileageOverviewResponse = SharedMileageOverviewResponse

export type DormStudentMileageAnalyticsResponse =
  SharedStudentMileageAnalyticsResponse<DormStudentMileageSummary>

export type DormClassMileageAnalyticsOverall = SharedClassMileageAnalyticsOverall

export type DormClassMileageAnalyticsResponse =
  SharedClassMileageAnalyticsResponse<DormClassMileageSummary>

export type DormStudentMileageSummaryResponse =
  SharedStudentMileageSummaryResponse<DormStudentMileageSummary>
