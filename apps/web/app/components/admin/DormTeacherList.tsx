'use client'

import { useEffect, useState } from 'react'
import {
  DormBadge,
  monoCellStyle,
  textCellStyle,
} from '@/app/components/admin/account-ui-shared'
import { RefetchWrapper } from '@/app/components/ui/primitives'
import { useLoadingGate } from '@/app/components/ui/useLoadingGate'
import { ListSkeleton } from '@/app/components/ui/list'
import { NoticeBox } from '@/app/components/ui/notice'

type Teacher = {
  teacherId: string
  name: string
  isDormTeacher: boolean
}

export default function DormTeacherList() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false)
  const showLoading = useLoadingGate({ active: isLoading && !hasLoadedOnce })
  const [error, setError] = useState<string | null>(null)
  const [toggleError, setToggleError] = useState<string | null>(null)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    void loadTeachers()
  }, [])

  async function loadTeachers() {
    let didLoadSuccessfully = false
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/teachers', { cache: 'no-store' })
      const result = await response.json().catch(() => null)
      if (!response.ok) {
        setError(result?.message ?? '교사 목록을 불러오지 못했습니다.')
        return
      }
      setTeachers(Array.isArray(result?.teachers) ? result.teachers : [])
      didLoadSuccessfully = true
    } catch {
      setError('교사 목록 조회 중 문제가 발생했습니다.')
    } finally {
      setIsLoading(false)
      if (didLoadSuccessfully) {
        setHasLoadedOnce(true)
      }
    }
  }

  async function toggleDormTeacher(teacher: Teacher) {
    const nextValue = !teacher.isDormTeacher
    setToggleError(null)
    setTeachers((prev) =>
      prev.map((t) =>
        t.teacherId === teacher.teacherId ? { ...t, isDormTeacher: nextValue } : t,
      ),
    )
    setUpdatingId(teacher.teacherId)
    try {
      const response = await fetch(`/api/admin/teachers/${encodeURIComponent(teacher.teacherId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDormTeacher: nextValue }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        setTeachers((prev) =>
          prev.map((t) =>
            t.teacherId === teacher.teacherId
              ? { ...t, isDormTeacher: teacher.isDormTeacher }
              : t,
          ),
        )
        setToggleError(payload?.message ?? '사감 권한 변경에 실패했습니다.')
      }
    } catch {
      setTeachers((prev) =>
        prev.map((t) =>
          t.teacherId === teacher.teacherId
            ? { ...t, isDormTeacher: teacher.isDormTeacher }
            : t,
        ),
      )
      setToggleError('사감 권한 변경 중 문제가 발생했습니다.')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-3">
      {toggleError && (
        <NoticeBox
          type="error"
          message={toggleError}
          onDismiss={() => setToggleError(null)}
        />
      )}

      {error ? (
        <NoticeBox type="error" message={error} />
      ) : (
        <div className="overflow-x-auto">
          {showLoading && (
            <div className="py-5">
              <ListSkeleton count={5} rowHeight="h-11" />
            </div>
          )}
          <RefetchWrapper
            isFetching={isLoading && hasLoadedOnce}
            isInitialLoad={showLoading}
          >
            <table className="w-full text-sm" style={{ borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['아이디', '이름', '사감 교사'].map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className="pb-2 text-left text-[11px] font-medium uppercase tracking-wider"
                      style={{ color: 'var(--fg-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher) => (
                  <tr
                    key={teacher.teacherId}
                    style={{ borderBottom: '1px solid var(--border)' }}
                  >
                    <td
                      className="py-3 text-xs"
                      style={monoCellStyle}
                    >
                      {teacher.teacherId}
                    </td>
                    <td
                      className="py-3 text-[13px] font-medium"
                      style={textCellStyle}
                    >
                      {teacher.name}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <DormBadge enabled={teacher.isDormTeacher} />
                        <button
                          type="button"
                          role="switch"
                          aria-checked={teacher.isDormTeacher}
                          disabled={updatingId === teacher.teacherId}
                          onClick={() => void toggleDormTeacher(teacher)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            width: 36,
                            height: 20,
                            borderRadius: 10,
                            padding: '2px',
                            backgroundColor: teacher.isDormTeacher
                              ? 'var(--accent)'
                              : 'var(--border)',
                            border: 'none',
                            cursor:
                              updatingId === teacher.teacherId
                                ? 'not-allowed'
                                : 'pointer',
                            opacity: updatingId === teacher.teacherId ? 0.6 : 1,
                            transition: 'background-color 0.15s',
                          }}
                        >
                          <span
                            style={{
                              display: 'block',
                              width: 16,
                              height: 16,
                              borderRadius: '50%',
                              backgroundColor: '#fff',
                              transform: teacher.isDormTeacher
                                ? 'translateX(16px)'
                                : 'translateX(0)',
                              transition: 'transform 0.15s',
                            }}
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </RefetchWrapper>
        </div>
      )}
    </div>
  )
}
