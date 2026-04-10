'use client'

import { RulesProvider } from '@/app/components/mileage/rules-context'

export default function AdminMileageLayout({ children }: { children: React.ReactNode }) {
  return <RulesProvider apiPath="/api/admin/school/rules">{children}</RulesProvider>
}
