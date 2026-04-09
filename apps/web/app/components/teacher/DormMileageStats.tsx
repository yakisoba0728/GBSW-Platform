import SharedMileageStatsView from './SharedMileageStatsView'
import type { DormMileageOverviewResponse } from './dorm-mileage-types'

const EMPTY_RESPONSE: DormMileageOverviewResponse = {
  summary: {
    rewardCount: 0,
    penaltyCount: 0,
    rewardSum: 0,
    penaltySum: 0,
    uniqueStudents: 0,
    totalCount: 0,
  },
  categoryStats: [],
  topRules: [],
}

export default function DormMileageStats() {
  return (
    <SharedMileageStatsView
      title="기숙사 통계 보기"
      subtitle="기간별 기숙사 상벌점 분포와 규칙별 집계를 확인합니다."
      fetchPath="/api/teacher/dorm-mileage/analytics/overview"
      emptyResponse={EMPTY_RESPONSE}
      rewardSectionTitle="카테고리별 집계 -- 상점"
      penaltySectionTitle="카테고리별 집계 -- 벌점"
      rewardEmptyMessage="해당 기간에 상점 내역이 없습니다."
      penaltyEmptyMessage="해당 기간에 벌점 내역이 없습니다."
      queryFailureMessage="통계 데이터를 불러오지 못했습니다."
      queryExceptionMessage="통계 조회 중 문제가 발생했습니다."
    />
  )
}
