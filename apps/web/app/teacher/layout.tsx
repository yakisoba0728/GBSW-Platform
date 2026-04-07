import TeacherShell from './_components/TeacherShell'
import { RulesProvider } from '@/app/components/mileage/rules-context'
import { DormRulesProvider } from '@/app/components/dorm-mileage/dorm-rules-context'
import { requireRoleSession } from '@/lib/route-guards'

export default async function TeacherLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  await requireRoleSession('teacher')

  return (
    <RulesProvider>
      <DormRulesProvider>
        <TeacherShell>{children}</TeacherShell>
      </DormRulesProvider>
    </RulesProvider>
  )
}
