'use client'

import { RulesProvider } from '@/app/teacher/_components/RulesContext'

export default function AdminMileageLayout({ children }: { children: React.ReactNode }) {
  return <RulesProvider apiPath="/api/admin/school-mileage/rules">{children}</RulesProvider>
}
