import LoadingState from '@/app/components/ui/LoadingState'
import { StudentViewRouteSkeleton } from '@/app/components/ui/route-loading'

export default function TeacherMileageStudentsLoading() {
  return (
    <LoadingState>
      <StudentViewRouteSkeleton />
    </LoadingState>
  )
}
