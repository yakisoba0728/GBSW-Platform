'use client'

import SharedStudentSelectionModal from './SharedStudentSelectionModal'
import type { DormMileageStudentOption } from './dorm-mileage-types'

type DormStudentSelectionModalProps = {
  isOpen: boolean
  addedStudentIds: Set<string>
  onClose: () => void
  onConfirm: (students: DormMileageStudentOption[]) => void
}

export default function DormStudentSelectionModal(
  props: DormStudentSelectionModalProps,
) {
  return (
    <SharedStudentSelectionModal<DormMileageStudentOption>
      {...props}
      apiPath="/api/teacher/dorm-mileage/students"
      title="대상 학생 추가"
      description="학년·반 조건으로 기숙사 학생을 찾아 추가하세요."
      emptyDescription="학년·반 조건을 바꿔 다시 찾아보세요."
      loadErrorMessage="학생 목록을 불러오지 못했습니다."
      fetchErrorMessage="학생 목록을 불러오는 중 문제가 발생했습니다."
    />
  )
}
