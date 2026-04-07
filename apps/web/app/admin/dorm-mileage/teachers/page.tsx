'use client'

import DormTeacherList from '@/app/components/admin/DormTeacherList'
import { Card } from '@/app/components/mileage/shared'

export default function AdminDormTeachersPage() {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--accent)',
            marginBottom: 6,
            fontFamily: 'var(--font-space-grotesk)',
          }}
        >
          Dorm Mileage
        </p>
        <h1
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: 'var(--fg)',
            fontFamily: 'var(--font-noto-sans-kr), sans-serif',
            letterSpacing: '-0.02em',
          }}
        >
          사감 교사 관리
        </h1>
        <p
          style={{
            marginTop: 6,
            fontSize: 13,
            color: 'var(--fg-muted)',
            fontFamily: 'var(--font-noto-sans-kr), sans-serif',
          }}
        >
          사감 교사로 지정된 계정만 기숙사 상벌점을 부여하고 수정할 수 있습니다.
        </p>
      </div>

      <Card>
        <DormTeacherList />
      </Card>
    </div>
  )
}
