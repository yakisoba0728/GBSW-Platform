import { notFound } from 'next/navigation'
import { parseScopeParam } from '@/lib/scope-utils'
import { RulesProvider } from '@/app/components/mileage/rules-context'

export default async function AdminScopeLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ scope: string }>
}) {
  const { scope: rawScope } = await params
  const scope = parseScopeParam(rawScope)
  if (!scope) notFound()
  const apiPath =
    scope === 'dorm'
      ? '/api/admin/dorm/rules'
      : '/api/admin/school/rules'
  return <RulesProvider apiPath={apiPath}>{children}</RulesProvider>
}
