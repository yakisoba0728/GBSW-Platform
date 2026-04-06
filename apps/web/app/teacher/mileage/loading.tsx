import LoadingState from '@/app/components/ui/LoadingState'
import { HistoryRouteSkeleton } from '@/app/components/ui/route-loading'

export default function TeacherMileageLoading() {
  return (
    <LoadingState>
      <HistoryRouteSkeleton />
    </LoadingState>
  )
}
