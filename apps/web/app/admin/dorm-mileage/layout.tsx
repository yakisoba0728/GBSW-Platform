'use client'

import { DormRulesProvider } from '@/app/components/dorm-mileage/dorm-rules-context'

export default function AdminDormMileageLayout({ children }: { children: React.ReactNode }) {
  return (
    <DormRulesProvider apiPath="/api/admin/dorm-mileage/rules">
      {children}
    </DormRulesProvider>
  )
}
