import { RulesProvider } from '@/app/components/mileage/rules-context'

export default function TeacherMileageLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <RulesProvider>{children}</RulesProvider>
}
