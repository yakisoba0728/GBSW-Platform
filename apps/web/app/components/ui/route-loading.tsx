import {
  FiltersTableSkeleton,
  PageHeaderSkeleton,
  QuickLinksSkeleton,
  StatsGridSkeleton,
  SummaryBarSkeleton,
  Surface,
  SkeletonBlock,
} from './page-skeletons'
import { CardListSkeleton, ListSkeleton, StatCardSkeleton } from './list'

export function TeacherHomeRouteSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeaderSkeleton eyebrow={false} titleWidth="24%" descriptionWidth="68%" />
      <StatsGridSkeleton count={3} />
    </div>
  )
}

export function HistoryRouteSkeleton({ columns = 6 }: { columns?: number }) {
  return <FiltersTableSkeleton columns={columns} rows={8} includeFilters />
}

export function RulesRouteSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Surface className="p-4">
        <div className="flex items-center gap-3">
          <SkeletonBlock width="120px" height={14} />
          <SkeletonBlock width="180px" height={14} />
        </div>
      </Surface>

      <Surface className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <SkeletonBlock width="240px" height={32} />
          <SkeletonBlock width="112px" height={32} />
          <SkeletonBlock width="128px" height={32} />
          <SkeletonBlock width="48px" height={12} className="ml-auto" />
        </div>
      </Surface>

      <Surface className="p-4">
        <ListSkeleton count={8} rowHeight="h-12" />
      </Surface>
    </div>
  )
}

export function ClassRouteSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Surface className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <SkeletonBlock width="128px" height={32} />
          <SkeletonBlock width="112px" height={32} />
          <SkeletonBlock width="88px" height={28} />
        </div>
      </Surface>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <StatCardSkeleton key={index} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <CardListSkeleton count={6} rowHeight="h-40" />
      </div>
    </div>
  )
}

export function ReportRouteSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Surface className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <SkeletonBlock width="132px" height={32} />
          <SkeletonBlock width="140px" height={32} />
          <SkeletonBlock width="96px" height={32} />
          <SkeletonBlock width="128px" height={32} />
          <SkeletonBlock width="128px" height={32} />
          <SkeletonBlock width="72px" height={28} className="ml-auto" />
          <SkeletonBlock width="72px" height={28} />
        </div>
      </Surface>

      <Surface className="overflow-hidden p-0">
        <div className="flex items-start justify-between px-5 py-4">
          <div className="space-y-2">
            <SkeletonBlock width="220px" height={16} />
            <SkeletonBlock width="120px" height={12} />
          </div>
          <SkeletonBlock width="72px" height={28} />
        </div>
        <div className="border-t p-4" style={{ borderColor: 'var(--border)' }}>
          <ListSkeleton count={6} rowHeight="h-12" />
        </div>
      </Surface>
    </div>
  )
}

export function StudentViewRouteSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Surface className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <SkeletonBlock width="140px" height={32} />
          <SkeletonBlock width="112px" height={32} />
          <SkeletonBlock width="112px" height={32} />
          <SkeletonBlock width="88px" height={28} />
        </div>
      </Surface>

      <StatsGridSkeleton count={4} />

      <Surface className="p-4">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
          <CardListSkeleton count={4} rowHeight="h-20" />
          <ListSkeleton count={6} rowHeight="h-12" />
        </div>
      </Surface>
    </div>
  )
}

export function GrantRouteSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Surface className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <SkeletonBlock width="128px" height={32} />
          <SkeletonBlock width="132px" height={32} />
          <SkeletonBlock width="220px" height={32} />
          <SkeletonBlock width="96px" height={28} />
        </div>
      </Surface>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Surface className="p-4">
          <ListSkeleton count={6} rowHeight="h-12" />
        </Surface>
        <Surface className="p-4">
          <SkeletonBlock width="42%" height={14} />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <SkeletonBlock key={index} width="100%" height={44} />
            ))}
          </div>
        </Surface>
      </div>
    </div>
  )
}

export function StudentHomeRouteSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeaderSkeleton />
      <StatsGridSkeleton count={3} />
      <SummaryBarSkeleton />
      <Surface className="p-5">
        <SkeletonBlock width="34%" height={14} />
        <ListSkeleton count={5} rowHeight="h-14" />
      </Surface>
      <QuickLinksSkeleton />
    </div>
  )
}
