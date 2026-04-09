'use client'

import SharedEditEntryModal from './SharedEditEntryModal'
import type { DormMileageHistoryItem } from './dorm-mileage-types'

export default function DormEditEntryModal({
  isOpen,
  item,
  onClose,
  onSaved,
}: {
  isOpen: boolean
  item: DormMileageHistoryItem | null
  onClose: () => void
  onSaved: (message: string) => Promise<void>
}) {
  return (
    <SharedEditEntryModal<DormMileageHistoryItem>
      isOpen={isOpen}
      item={item}
      onClose={onClose}
      onSaved={onSaved}
      apiPath="/api/teacher/dorm-mileage/entries"
      title="기숙사 상벌점 내역 편집"
      saveErrorMessage="기숙사 상벌점 내역을 수정하지 못했습니다."
      saveSuccessMessage="기숙사 상벌점 내역이 수정되었습니다."
      submitErrorMessage="기숙사 상벌점 내역 수정 중 문제가 발생했습니다."
    />
  )
}
