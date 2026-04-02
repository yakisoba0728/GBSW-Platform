import BrandPanel from '../components/BrandPanel'
import ChangePasswordForm from '../components/ChangePasswordForm'
import { requireChangePasswordSession } from '@/lib/route-guards'

export default async function ChangePasswordPage() {
  const session = await requireChangePasswordSession()

  return (
    <main className="flex min-h-screen w-full">
      <BrandPanel />
      <ChangePasswordForm accountId={session.accountId} role={session.role} />
    </main>
  )
}
