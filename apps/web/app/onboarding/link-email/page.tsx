import { requireOnboardingSession } from '@/lib/route-guards'
import OnboardingProgress from '../_components/OnboardingProgress'
import LinkEmailForm from './_components/LinkEmailForm'

export default async function OnboardingLinkEmailPage() {
  await requireOnboardingSession('link-email')

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <OnboardingProgress step={2} total={3} label="이메일 연동(권장)" />
      <LinkEmailForm />
    </div>
  )
}
