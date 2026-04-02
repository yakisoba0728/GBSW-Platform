import AdminShell from './components/AdminShell'
import { requireRoleSession } from '@/lib/route-guards'

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  await requireRoleSession('super-admin')

  return <AdminShell>{children}</AdminShell>
}
