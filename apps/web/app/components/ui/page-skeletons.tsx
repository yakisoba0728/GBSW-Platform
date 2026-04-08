'use client'

import type { CSSProperties, ReactNode } from 'react'
import { CardListSkeleton, ListSkeleton, StatCardSkeleton, TableRowSkeleton } from './list'

export type PageSkeletonVariant = 'dashboard' | 'stats' | 'filters-table' | 'auth'

export function SkeletonBlock({
  width = '100%',
  height,
  className = '',
  style,
}: {
  width?: string
  height: number
  className?: string
  style?: CSSProperties
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-md ${className}`.trim()}
      style={{
        width,
        height,
        backgroundColor: 'var(--border)',
        ...style,
      }}
    >
      <div
        className="absolute inset-0 animate-shimmer"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 50%, transparent 100%)',
        }}
      />
    </div>
  )
}

export function Surface({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={`rounded-xl border ${className}`.trim()}
      style={{
        borderColor: 'var(--border)',
        backgroundColor: 'var(--bg-subtle)',
      }}
    >
      {children}
    </div>
  )
}

export function PageHeaderSkeleton({
  eyebrow = true,
  titleWidth = '40%',
  descriptionWidth = '65%',
}: {
  eyebrow?: boolean
  titleWidth?: string
  descriptionWidth?: string
}) {
  return (
    <Surface className="p-5">
      {eyebrow && <SkeletonBlock width="28%" height={11} />}
      <SkeletonBlock
        width={titleWidth}
        height={26}
        className={eyebrow ? 'mt-3' : ''}
      />
      <SkeletonBlock width={descriptionWidth} height={14} className="mt-2" />
    </Surface>
  )
}

export function StatsGridSkeleton({
  count = 3,
  className = '',
}: {
  count?: number
  className?: string
}) {
  const gridClass =
    count === 4
      ? 'grid grid-cols-2 gap-3 md:grid-cols-4'
      : 'grid grid-cols-1 gap-3 md:grid-cols-3'

  return (
    <div className={`${gridClass} ${className}`.trim()}>
      {Array.from({ length: count }).map((_, index) => (
        <StatCardSkeleton key={index} />
      ))}
    </div>
  )
}

export function SummaryBarSkeleton() {
  return (
    <Surface className="p-5">
      <SkeletonBlock width="32%" height={12} />
      <SkeletonBlock
        width="100%"
        height={12}
        className="mt-4 rounded-full"
        style={{ borderRadius: 9999 }}
      />
      <div className="mt-3 flex items-center justify-between gap-3">
        <SkeletonBlock width="26%" height={11} />
        <SkeletonBlock width="26%" height={11} />
      </div>
    </Surface>
  )
}

export function ChartCardSkeleton({
  bars = 4,
  className = '',
}: {
  bars?: number
  className?: string
}) {
  return (
    <Surface className={`p-5 ${className}`.trim()}>
      <SkeletonBlock width="42%" height={14} />
      <div className="mt-4 space-y-3">
        {Array.from({ length: bars }).map((_, index) => (
          <div key={index} className="flex items-center gap-3">
            <SkeletonBlock width="80px" height={18} />
            <SkeletonBlock width={`${90 - index * 12}%`} height={20} />
          </div>
        ))}
      </div>
    </Surface>
  )
}

export function FiltersTableSkeleton({
  columns = 6,
  rows = 8,
  includeFilters = true,
}: {
  columns?: number
  rows?: number
  includeFilters?: boolean
}) {
  return (
    <div className="flex flex-col gap-3">
      {includeFilters && (
        <Surface className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <SkeletonBlock width="56px" height={12} />
            <SkeletonBlock width="128px" height={32} />
            <SkeletonBlock width="112px" height={32} />
            <SkeletonBlock width="224px" height={32} />
            <SkeletonBlock width="96px" height={32} />
          </div>
        </Surface>
      )}

      <Surface className="overflow-hidden p-4">
        <table className="w-full table-fixed">
          <thead className="table-header">
            <tr>
              {Array.from({ length: columns }).map((_, index) => (
                <th key={index} scope="col">
                  <SkeletonBlock width="70%" height={10} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <TableRowSkeleton columns={columns} count={rows} />
          </tbody>
        </table>
      </Surface>
    </div>
  )
}

export function QuickLinksSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <CardListSkeleton count={count} rowHeight="h-40" />
    </div>
  )
}

export function DashboardPageSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeaderSkeleton />
      <StatsGridSkeleton count={3} />
      <SummaryBarSkeleton />
      <Surface className="p-5">
        <SkeletonBlock width="34%" height={14} />
        <ListSkeleton count={5} rowHeight="h-14" />
      </Surface>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Surface key={index} className="p-5">
            <SkeletonBlock width="36px" height={36} />
            <SkeletonBlock width="55%" height={16} className="mt-6" />
            <SkeletonBlock width="78%" height={13} className="mt-2" />
            <SkeletonBlock width="72%" height={13} className="mt-1.5" />
          </Surface>
        ))}
      </div>
    </div>
  )
}

export function StatsPageSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <PageHeaderSkeleton />
      <StatsGridSkeleton count={4} />
      <SummaryBarSkeleton />
      <ChartCardSkeleton />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>
    </div>
  )
}

export function AuthPageSkeleton() {
  return (
    <section
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100svh',
        backgroundColor: 'var(--bg)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 32px',
        }}
      >
        <SkeletonBlock width="120px" height={20} />
        <SkeletonBlock width="32px" height={32} />
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 32px 40px',
        }}
      >
        <Surface className="w-full max-w-[380px] p-6">
          <SkeletonBlock width="26%" height={11} />
          <SkeletonBlock width="58%" height={26} className="mt-3" />
          <SkeletonBlock width="82%" height={14} className="mt-2" />
          <SkeletonBlock width="100%" height={40} className="mt-8" />
          <SkeletonBlock width="100%" height={40} className="mt-4" />
          <SkeletonBlock width="100%" height={42} className="mt-6" />
        </Surface>
      </div>
    </section>
  )
}

export function PageSkeleton({
  variant,
}: {
  variant: PageSkeletonVariant
}) {
  switch (variant) {
    case 'dashboard':
      return <DashboardPageSkeleton />
    case 'stats':
      return <StatsPageSkeleton />
    case 'filters-table':
      return <FiltersTableSkeleton />
    case 'auth':
      return <AuthPageSkeleton />
  }
}
