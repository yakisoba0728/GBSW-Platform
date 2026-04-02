'use client'

import type { StudentMileageSummary } from './school-mileage-types'

export default function StudentReportTable({
  students,
}: {
  students: StudentMileageSummary[]
}) {
  return (
    <table className="w-full text-xs">
      <thead>
        <tr
          style={{
            borderBottom: '1px solid var(--admin-border)',
            backgroundColor: 'var(--admin-bg)',
          }}
        >
          {['학년', '반', '번호', '이름', '상점', '벌점', '순점수'].map(
            (header) => (
              <th
                key={header}
                className="px-3 py-3 text-left font-semibold"
                style={{
                  fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                  color: 'var(--admin-text-muted)',
                }}
              >
                {header}
              </th>
            ),
          )}
        </tr>
      </thead>
      <tbody>
        {students.map((student) => (
          <tr
            key={student.studentId}
            style={{ borderBottom: '1px solid var(--admin-border)' }}
          >
            <td
              className="px-3 py-2.5"
              style={{
                fontFamily: 'var(--font-space-grotesk)',
                color: 'var(--admin-text-muted)',
              }}
            >
              {student.grade ?? '—'}
            </td>
            <td
              className="px-3 py-2.5"
              style={{
                fontFamily: 'var(--font-space-grotesk)',
                color: 'var(--admin-text-muted)',
              }}
            >
              {student.classNumber}
            </td>
            <td
              className="px-3 py-2.5"
              style={{
                fontFamily: 'var(--font-space-grotesk)',
                color: 'var(--admin-text-muted)',
              }}
            >
              {student.studentNumber}
            </td>
            <td
              className="px-3 py-2.5 font-medium"
              style={{
                fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                color: 'var(--admin-text)',
              }}
            >
              {student.name}
            </td>
            <td
              className="px-3 py-2.5 font-semibold"
              style={{
                fontFamily: 'var(--font-space-grotesk)',
                color: '#16a34a',
              }}
            >
              +{student.rewardTotal}
            </td>
            <td
              className="px-3 py-2.5 font-semibold"
              style={{
                fontFamily: 'var(--font-space-grotesk)',
                color: '#dc2626',
              }}
            >
              -{student.penaltyTotal}
            </td>
            <td
              className="px-3 py-2.5 font-bold"
              style={{
                fontFamily: 'var(--font-space-grotesk)',
                color: student.netScore >= 0 ? '#16a34a' : '#dc2626',
              }}
            >
              {student.netScore >= 0 ? '+' : ''}
              {student.netScore}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
