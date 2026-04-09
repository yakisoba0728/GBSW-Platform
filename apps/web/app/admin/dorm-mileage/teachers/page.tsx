'use client'

import DormTeacherList from '@/app/components/admin/DormTeacherList'
import {
  AccountPageIntro,
  AdminPanel,
} from '@/app/components/admin/account-ui-shared'

export default function AdminDormTeachersPage() {
  return (
    <div className="flex flex-col gap-4">
      <AccountPageIntro
        eyebrow="Dorm Mileage"
        title="사감 교사 관리"
        description="사감 교사로 지정된 계정만 기숙사 상벌점을 부여하고 수정할 수 있습니다."
      />

      <AdminPanel>
        <DormTeacherList />
      </AdminPanel>
    </div>
  )
}
