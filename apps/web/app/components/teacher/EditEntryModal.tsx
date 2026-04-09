'use client'

import SharedEditEntryModal from './SharedEditEntryModal'
import type { SchoolMileageHistoryItem } from './school-mileage-types'

export default function EditEntryModal({
  isOpen,
  item,
  onClose,
  onSaved,
}: {
  isOpen: boolean
  item: SchoolMileageHistoryItem | null
  onClose: () => void
  onSaved: (message: string) => Promise<void>
}) {
  return (
    <SharedEditEntryModal<SchoolMileageHistoryItem>
      isOpen={isOpen}
      item={item}
      onClose={onClose}
      onSaved={onSaved}
      apiPath="/api/teacher/school-mileage/entries"
      title="상벌점 내역 편집"
      saveErrorMessage="상벌점 내역을 수정하지 못했습니다."
      saveSuccessMessage="상벌점 내역이 수정되었습니다."
      submitErrorMessage="상벌점 내역 수정 중 문제가 발생했습니다."
      showSchoolLabel
    />
  )
}
