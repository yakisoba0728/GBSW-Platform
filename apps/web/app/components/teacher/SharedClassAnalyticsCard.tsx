'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Card } from '../mileage/shared'
import { AnimatedListItem } from '../ui/list'
import {
  getMicroInteractionTransition,
  useMotionPreference,
} from '../ui/motion'
import type {
  SharedClassMileageSummary,
  SharedStudentMileageSummary,
} from './shared-mileage-types'

function ChevronDownIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      style={{
        transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        transition: 'transform 250ms ease',
      }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function StudentRow({
  student,
  rank,
  colorToken,
}: {
  student: SharedStudentMileageSummary
  rank: number
  colorToken: 'green' | 'red'
}) {
  const color = colorToken === 'green' ? 'var(--reward)' : 'var(--penalty)'
  const background =
    colorToken === 'green' ? 'var(--reward-subtle)' : 'var(--penalty-subtle)'

  return (
    <div
      className="flex items-center gap-2 rounded-md px-2.5 py-1.5"
      style={{ backgroundColor: 'var(--bg)' }}
    >
      <span
        className="h-5 w-5 flex-shrink-0 rounded-full text-center text-[10px] font-bold leading-5"
        style={{
          backgroundColor: background,
          color,
          fontFamily: 'var(--font-space-grotesk)',
        }}
      >
        {rank}
      </span>
      <span
        className="min-w-0 flex-1 truncate text-xs font-medium"
        style={{
          fontFamily: 'var(--font-noto-sans-kr), sans-serif',
          color: 'var(--fg)',
        }}
      >
        {student.name}
      </span>
      <span
        className="flex-shrink-0 text-xs font-semibold"
        style={{
          fontFamily: 'var(--font-space-grotesk)',
          color,
        }}
      >
        {student.netScore >= 0 ? '+' : ''}
        {student.netScore}점
      </span>
    </div>
  )
}

export function BuildingAnalyticsIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: 'var(--accent)' }}
      aria-hidden="true"
    >
      <path d="M4 20V5a1 1 0 0 1 1-1h6v16" />
      <path d="M11 20V9a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v11" />
      <path d="M8 8h.01" />
      <path d="M8 12h.01" />
      <path d="M15 12h.01" />
      <path d="M15 16h.01" />
      <path d="M20 20H3" />
    </svg>
  )
}

export default function SharedClassAnalyticsCard<
  Summary extends SharedClassMileageSummary,
>({
  summary,
  isExpanded,
  onToggle,
  index,
  emptyDescription,
}: {
  summary: Summary
  isExpanded: boolean
  onToggle: () => void
  index: number
  emptyDescription: string
}) {
  const prefersReducedMotion = useMotionPreference()
  const expandTransition = getMicroInteractionTransition(prefersReducedMotion)

  return (
    <AnimatedListItem index={index}>
      <Card className="overflow-hidden p-0">
        <button
          type="button"
          onClick={onToggle}
          className="w-full px-4 pb-3 pt-4 text-left transition-colors hover:opacity-90"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="text-2xl font-bold"
                style={{
                  fontFamily: 'var(--font-space-grotesk)',
                  color: 'var(--fg)',
                }}
              >
                {summary.classNumber}반
              </span>
              <span
                className="rounded-full px-2 py-0.5 text-[11px]"
                style={{
                  fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                  backgroundColor: 'var(--border)',
                  color: 'var(--fg-muted)',
                }}
              >
                {summary.studentCount}명
              </span>
            </div>
            <div style={{ color: 'var(--fg-muted)' }}>
              <ChevronDownIcon open={isExpanded} />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div
              className="rounded-md px-3 py-2"
              style={{
                backgroundColor: 'var(--reward-subtle)',
                border: '1px solid var(--reward-border)',
              }}
            >
              <p
                className="text-[10px] uppercase tracking-wider"
                style={{
                  fontFamily: 'var(--font-space-grotesk)',
                  color: 'var(--reward)',
                }}
              >
                상점 합계
              </p>
              <p
                className="mt-0.5 text-base font-semibold"
                style={{
                  fontFamily: 'var(--font-space-grotesk)',
                  color: 'var(--reward)',
                }}
              >
                +{summary.rewardTotal}
              </p>
            </div>
            <div
              className="rounded-md px-3 py-2"
              style={{
                backgroundColor: 'var(--penalty-subtle)',
                border: '1px solid var(--penalty-border)',
              }}
            >
              <p
                className="text-[10px] uppercase tracking-wider"
                style={{
                  fontFamily: 'var(--font-space-grotesk)',
                  color: 'var(--penalty)',
                }}
              >
                벌점 합계
              </p>
              <p
                className="mt-0.5 text-base font-semibold"
                style={{
                  fontFamily: 'var(--font-space-grotesk)',
                  color: 'var(--penalty)',
                }}
              >
                -{summary.penaltyTotal}
              </p>
            </div>
            <div
              className="rounded-md px-3 py-2"
              style={{
                backgroundColor: 'var(--bg)',
                border: '1px solid var(--border)',
              }}
            >
              <p
                className="text-[10px] uppercase tracking-wider"
                style={{
                  fontFamily: 'var(--font-space-grotesk)',
                  color: 'var(--fg-muted)',
                }}
              >
                순점수 합
              </p>
              <p
                className="mt-0.5 text-base font-semibold"
                style={{
                  fontFamily: 'var(--font-space-grotesk)',
                  color:
                    summary.netScore >= 0
                      ? 'var(--reward)'
                      : 'var(--penalty)',
                }}
              >
                {summary.netScore >= 0 ? '+' : ''}
                {summary.netScore}
              </p>
            </div>
            <div
              className="rounded-md px-3 py-2"
              style={{
                backgroundColor: 'var(--bg)',
                border: '1px solid var(--border)',
              }}
            >
              <p
                className="text-[10px] uppercase tracking-wider"
                style={{
                  fontFamily: 'var(--font-space-grotesk)',
                  color: 'var(--fg-muted)',
                }}
              >
                1인 평균
              </p>
              <p
                className="mt-0.5 text-base font-semibold"
                style={{
                  fontFamily: 'var(--font-space-grotesk)',
                  color:
                    summary.avgNetScore >= 0
                      ? 'var(--reward)'
                      : 'var(--penalty)',
                }}
              >
                {summary.avgNetScore >= 0 ? '+' : ''}
                {summary.avgNetScore}
              </p>
            </div>
          </div>
        </button>

        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              key="expanded"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={expandTransition}
              style={{ overflow: 'hidden', borderTop: '1px solid var(--border)' }}
            >
              <div className="px-4 pb-4 pt-1">
                {summary.topStudents.length > 0 && (
                  <div className="mt-3">
                    <p
                      className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider"
                      style={{
                        fontFamily: 'var(--font-space-grotesk)',
                        color: 'var(--reward)',
                      }}
                    >
                      상위 학생
                    </p>
                    <div className="space-y-1">
                      {summary.topStudents.map((student, studentIndex) => (
                        <StudentRow
                          key={student.studentId}
                          student={student}
                          rank={studentIndex + 1}
                          colorToken="green"
                        />
                      ))}
                    </div>
                  </div>
                )}
                {summary.bottomStudents.length > 0 && (
                  <div className="mt-3">
                    <p
                      className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider"
                      style={{
                        fontFamily: 'var(--font-space-grotesk)',
                        color: 'var(--penalty)',
                      }}
                    >
                      주의 학생
                    </p>
                    <div className="space-y-1">
                      {summary.bottomStudents.map((student, studentIndex) => (
                        <StudentRow
                          key={student.studentId}
                          student={student}
                          rank={studentIndex + 1}
                          colorToken="red"
                        />
                      ))}
                    </div>
                  </div>
                )}
                {summary.topStudents.length === 0 &&
                  summary.bottomStudents.length === 0 && (
                    <p
                      className="mt-3 py-2 text-center text-xs"
                      style={{
                        fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                        color: 'var(--fg-muted)',
                      }}
                    >
                      {emptyDescription}
                    </p>
                  )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </AnimatedListItem>
  )
}
