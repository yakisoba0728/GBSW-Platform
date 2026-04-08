'use client'

type SharedClassSummary = {
  classNumber: number
  studentCount: number
  rewardTotal: number
  penaltyTotal: number
  netScore: number
  avgNetScore: number
}

export default function ClassReportTable({
  classes,
}: {
  classes: SharedClassSummary[]
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
          {['반', '학생 수', '상점 합계', '벌점 합계', '순점수 합', '1인 평균'].map(
            (header) => (
              <th
                key={header}
                scope="col"
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
        {classes.map((classSummary) => (
          <tr
            key={classSummary.classNumber}
            style={{ borderBottom: '1px solid var(--admin-border)' }}
          >
            <td
              className="px-3 py-2.5 font-semibold"
              style={{
                fontFamily: 'var(--font-space-grotesk)',
                color: 'var(--admin-text)',
              }}
            >
              {classSummary.classNumber}반
            </td>
            <td
              className="px-3 py-2.5"
              style={{
                fontFamily: 'var(--font-space-grotesk)',
                color: 'var(--admin-text-muted)',
              }}
            >
              {classSummary.studentCount}명
            </td>
            <td
              className="px-3 py-2.5 font-semibold"
              style={{
                fontFamily: 'var(--font-space-grotesk)',
                color: '#16a34a',
              }}
            >
              +{classSummary.rewardTotal}
            </td>
            <td
              className="px-3 py-2.5 font-semibold"
              style={{
                fontFamily: 'var(--font-space-grotesk)',
                color: '#dc2626',
              }}
            >
              -{classSummary.penaltyTotal}
            </td>
            <td
              className="px-3 py-2.5 font-bold"
              style={{
                fontFamily: 'var(--font-space-grotesk)',
                color: classSummary.netScore >= 0 ? '#16a34a' : '#dc2626',
              }}
            >
              {classSummary.netScore >= 0 ? '+' : ''}
              {classSummary.netScore}
            </td>
            <td
              className="px-3 py-2.5"
              style={{
                fontFamily: 'var(--font-space-grotesk)',
                color: classSummary.avgNetScore >= 0 ? '#16a34a' : '#dc2626',
              }}
            >
              {classSummary.avgNetScore >= 0 ? '+' : ''}
              {classSummary.avgNetScore}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
