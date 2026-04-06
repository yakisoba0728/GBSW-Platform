import LoadingState from '@/app/components/ui/LoadingState'
import { PageSkeleton } from '@/app/components/ui/page-skeletons'

export default function TeacherMileageStatsLoading() {
  return (
    <LoadingState>
      <PageSkeleton variant="stats" />
    </LoadingState>
  )
}
