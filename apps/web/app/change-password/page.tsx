import AuthShell from '../components/auth/AuthShell'
import ChangePasswordForm from '../components/ChangePasswordForm'
import { requireChangePasswordSession } from '@/lib/route-guards'

export default async function ChangePasswordPage() {
  const session = await requireChangePasswordSession()

  return (
    <AuthShell>
      <div style={{ flex: 1, height: '100%' }}>
        <ChangePasswordForm accountId={session.accountId} role={session.role} />
      </div>
    </AuthShell>
  )
}
