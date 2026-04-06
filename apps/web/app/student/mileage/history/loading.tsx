import LoadingState from '@/app/components/ui/LoadingState'
import { HistoryRouteSkeleton } from '@/app/components/ui/route-loading'

export default function StudentMileageHistoryLoading() {
  return (
    <LoadingState>
      <HistoryRouteSkeleton columns={5} />
    </LoadingState>
  )
}
