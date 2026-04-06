import LoadingState from '@/app/components/ui/LoadingState'
import { ClassRouteSkeleton } from '@/app/components/ui/route-loading'

export default function TeacherMileageClassesLoading() {
  return (
    <LoadingState>
      <ClassRouteSkeleton />
    </LoadingState>
  )
}
