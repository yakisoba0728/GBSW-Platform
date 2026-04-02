import TeacherShell from './_components/TeacherShell'
import { RulesProvider } from './_components/RulesContext'
import { requireRoleSession } from '@/lib/route-guards'

export default async function TeacherLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  await requireRoleSession('teacher')

  return (
    <RulesProvider>
      <TeacherShell>{children}</TeacherShell>
    </RulesProvider>
  )
}
