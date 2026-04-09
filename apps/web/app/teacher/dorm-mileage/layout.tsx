import { DormRulesProvider } from '@/app/components/dorm-mileage/dorm-rules-context'

export default function TeacherDormMileageLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <DormRulesProvider>{children}</DormRulesProvider>
}
