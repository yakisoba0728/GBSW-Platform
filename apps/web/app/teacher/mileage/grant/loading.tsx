import LoadingState from '@/app/components/ui/LoadingState'
import { GrantRouteSkeleton } from '@/app/components/ui/route-loading'

export default function TeacherMileageGrantLoading() {
  return (
    <LoadingState>
      <GrantRouteSkeleton />
    </LoadingState>
  )
}
