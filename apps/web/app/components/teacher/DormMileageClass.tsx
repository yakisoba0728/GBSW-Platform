import SharedMileageClassView from './SharedMileageClassView'
import type { DormClassMileageAnalyticsResponse } from './dorm-mileage-types'

const EMPTY_RESPONSE: DormClassMileageAnalyticsResponse = {
  classes: [],
  overall: {
    classCount: 0,
    totalStudents: 0,
    rewardTotal: 0,
    penaltyTotal: 0,
    netScore: 0,
  },
}

export default function DormMileageClass() {
  return (
    <SharedMileageClassView
      title="학급별 현황"
      subtitle="반별 기숙사 상점·벌점 합계와 학생 현황을 비교합니다. 카드를 클릭하면 상위·주의 학생을 확인할 수 있습니다."
      fetchPath="/api/teacher/dorm-mileage/analytics/classes"
      emptyResponse={EMPTY_RESPONSE}
      emptyCardDescription="이 반에 기숙사 상벌점 내역이 없습니다."
      queryFailureMessage="학급 현황 데이터를 불러오지 못했습니다."
      queryExceptionMessage="학급 현황 조회 중 문제가 발생했습니다."
    />
  )
}
