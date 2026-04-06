import LoadingState from '@/app/components/ui/LoadingState'
import { RulesRouteSkeleton } from '@/app/components/ui/route-loading'

export default function StudentMileageRulesLoading() {
  return (
    <LoadingState>
      <RulesRouteSkeleton />
    </LoadingState>
  )
}
