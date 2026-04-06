import LoadingState from '../components/ui/LoadingState'
import { StudentHomeRouteSkeleton } from '../components/ui/route-loading'

export default function StudentLoading() {
  return (
    <LoadingState>
      <StudentHomeRouteSkeleton />
    </LoadingState>
  )
}
