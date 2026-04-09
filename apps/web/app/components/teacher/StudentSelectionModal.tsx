'use client'

import SharedStudentSelectionModal from './SharedStudentSelectionModal'
import type { SchoolMileageStudentOption } from './school-mileage-types'

type StudentSelectionModalProps = {
  isOpen: boolean
  addedStudentIds: Set<string>
  onClose: () => void
  onConfirm: (students: SchoolMileageStudentOption[]) => void
}

export default function StudentSelectionModal(props: StudentSelectionModalProps) {
  return (
    <SharedStudentSelectionModal<SchoolMileageStudentOption>
      {...props}
      apiPath="/api/teacher/school-mileage/students"
      title="대상 학생 추가"
      description="학교와 학년 조건으로 학생을 찾아 추가하세요."
      emptyDescription="학교와 학년 조건을 바꿔 다시 찾아보세요."
      loadErrorMessage="학생 목록을 불러오지 못했습니다."
      fetchErrorMessage="학생 목록을 불러오는 중 문제가 발생했습니다."
      showSchoolFilter
      showSchoolLabel
    />
  )
}
