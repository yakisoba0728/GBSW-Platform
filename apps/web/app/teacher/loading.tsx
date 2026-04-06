import LoadingState from '../components/ui/LoadingState'
import { TeacherHomeRouteSkeleton } from '../components/ui/route-loading'

export default function TeacherLoading() {
  return (
    <LoadingState>
      <TeacherHomeRouteSkeleton />
    </LoadingState>
  )
}
