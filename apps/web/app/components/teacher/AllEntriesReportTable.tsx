'use client'

type SharedHistoryItem = {
  id: number
  type: 'reward' | 'penalty'
  score: number
  awardedAt: string
  ruleCategory: string
  ruleName: string
  studentName: string
  classNumber: number
  studentNumber: number
  teacherName: string
}

export default function AllEntriesReportTable({
  entries,
}: {
  entries: SharedHistoryItem[]
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
          {['반', '번호', '이름', '유형', '카테고리', '항목', '점수', '일시', '담당교사'].map(
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
        {entries.map((entry) => (
          <tr
            key={entry.id}
            style={{ borderBottom: '1px solid var(--admin-border)' }}
          >
            <td
              className="px-3 py-2"
              style={{
                fontFamily: 'var(--font-space-grotesk)',
                color: 'var(--admin-text-muted)',
              }}
            >
              {entry.classNumber}
            </td>
            <td
              className="px-3 py-2"
              style={{
                fontFamily: 'var(--font-space-grotesk)',
                color: 'var(--admin-text-muted)',
              }}
            >
              {entry.studentNumber}
            </td>
            <td
              className="px-3 py-2 font-medium"
              style={{
                fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                color: 'var(--admin-text)',
              }}
            >
              {entry.studentName}
            </td>
            <td className="px-3 py-2">
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{
                  backgroundColor:
                    entry.type === 'reward'
                      ? 'rgba(34,197,94,0.12)'
                      : 'rgba(239,68,68,0.12)',
                  color: entry.type === 'reward' ? '#16a34a' : '#dc2626',
                }}
              >
                {entry.type === 'reward' ? '상점' : '벌점'}
              </span>
            </td>
            <td
              className="px-3 py-2"
              style={{
                fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                color: 'var(--admin-text-muted)',
              }}
            >
              {entry.ruleCategory}
            </td>
            <td
              className="max-w-[120px] truncate px-3 py-2"
              style={{
                fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                color: 'var(--admin-text)',
              }}
            >
              {entry.ruleName}
            </td>
            <td
              className="px-3 py-2 font-semibold"
              style={{
                fontFamily: 'var(--font-space-grotesk)',
                color: entry.type === 'reward' ? '#16a34a' : '#dc2626',
              }}
            >
              {entry.type === 'reward' ? '+' : '-'}
              {entry.score}
            </td>
            <td
              className="whitespace-nowrap px-3 py-2"
              style={{
                fontFamily: 'var(--font-space-grotesk)',
                color: 'var(--admin-text-muted)',
              }}
            >
              {new Date(entry.awardedAt).toLocaleDateString('ko-KR')}
            </td>
            <td
              className="px-3 py-2"
              style={{
                fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                color: 'var(--admin-text-muted)',
              }}
            >
              {entry.teacherName}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
