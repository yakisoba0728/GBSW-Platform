import LoadingState from '@/app/components/ui/LoadingState'
import { ReportRouteSkeleton } from '@/app/components/ui/route-loading'

export default function TeacherMileageReportLoading() {
  return (
    <LoadingState>
      <ReportRouteSkeleton />
    </LoadingState>
  )
}
