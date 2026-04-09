import { requireRoleSession } from '@/lib/route-guards'
import AdminDbClient from './_components/AdminDbClient'

export default async function AdminDbPage() {
  await requireRoleSession('super-admin')
  return <AdminDbClient />
}
