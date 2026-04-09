import { notFound } from 'next/navigation'
import { parseScopeParam } from '@/lib/scope-utils'

export default async function StudentScopeLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ scope: string }>
}) {
  const { scope: rawScope } = await params
  if (!parseScopeParam(rawScope)) notFound()
  return <>{children}</>
}
