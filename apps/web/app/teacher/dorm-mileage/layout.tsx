import { DormRulesProvider } from '@/app/components/mileage/rules-context'

export default function TeacherDormMileageLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <DormRulesProvider>{children}</DormRulesProvider>
}
