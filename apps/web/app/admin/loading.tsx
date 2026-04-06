import LoadingState from '../components/ui/LoadingState'
import { RulesRouteSkeleton } from '../components/ui/route-loading'

export default function AdminLoading() {
  return (
    <LoadingState>
      <RulesRouteSkeleton />
    </LoadingState>
  )
}
