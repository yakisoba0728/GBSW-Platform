import { requireOnboardingSession } from '@/lib/route-guards'
import OnboardingProgress from '../_components/OnboardingProgress'
import LinkPhoneForm from './_components/LinkPhoneForm'

export default async function OnboardingLinkPhonePage() {
  const session = await requireOnboardingSession('link-phone')

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <OnboardingProgress step={3} total={3} label="전화번호 연동(권장)" />
      <LinkPhoneForm role={session.role} />
    </div>
  )
}
