import LoadingState from '@/app/components/ui/LoadingState'
import { HistoryRouteSkeleton } from '@/app/components/ui/route-loading'

export default function TeacherMileageHistoryLoading() {
  return (
    <LoadingState>
      <HistoryRouteSkeleton />
    </LoadingState>
  )
}
