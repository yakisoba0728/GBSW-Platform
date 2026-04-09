import ChangePasswordForm from '@/app/components/ChangePasswordForm'
import { requireOnboardingSession } from '@/lib/route-guards'
import OnboardingProgress from '../_components/OnboardingProgress'

export default async function OnboardingChangePasswordPage() {
  const session = await requireOnboardingSession('change-password')

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <OnboardingProgress step={1} total={3} label="비밀번호 변경" />
      <ChangePasswordForm
        accountId={session.accountId}
        role={session.role}
        requireCurrentPassword={false}
        successRedirectTo="/onboarding/link-email"
        embedded
      />
    </div>
  )
}
