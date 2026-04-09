import { notFound } from 'next/navigation'
import { RulesProvider } from '@/app/components/mileage/rules-context'
import { parseScopeParam } from '@/lib/scope-utils'

export default async function TeacherScopeLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ scope: string }>
}) {
  const { scope: rawScope } = await params
  const scope = parseScopeParam(rawScope)
  if (!scope) notFound()
  return <RulesProvider scope={scope}>{children}</RulesProvider>
}
