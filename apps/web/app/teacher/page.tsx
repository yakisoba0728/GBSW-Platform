import { RulesProvider } from '@/app/components/mileage/rules-context'
import TeacherHome from './_components/TeacherHome'

export default function TeacherPage() {
  return (
    <RulesProvider>
      <TeacherHome />
    </RulesProvider>
  )
}
