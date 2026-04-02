'use client'

import { useCallback, useEffect, useRef, useState, useMemo } from 'react'
import {
  Card,
  FilterRow,
  NoticeBox,
  SectionHeader,
  SectionTitle,
  SCHOOL_OPTIONS,
  getSchoolLabel,
  inputStyle,
} from './teacher-shared'
import { ListEmptyState, LoadingSpinner } from '../ui/list'
import type {
  SchoolCode,
  SchoolMileageHistoryItem,
} from './school-mileage-types'

type ReportType = 'student' | 'class' | 'all'

const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  student: '학생별 보고서',
  class: '학급별 보고서',
  all: '전체 내역',
}

function PrintIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  )
}

function EyeIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function FileIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--admin-accent)' }} aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}

// ─── 학생별 보고서 테이블 ─────────────────────────────────────────────────────

function StudentReportTable({ entries }: { entries: SchoolMileageHistoryItem[] }) {
  const studentMap = useMemo(() => {
    const map = new Map<string, { name: string; school: SchoolCode; grade: number | null; classNumber: number; studentNumber: number; reward: number; penalty: number; net: number }>()
    for (const e of entries) {
      const existing = map.get(e.studentId) ?? {
        name: e.studentName,
        school: e.school,
        grade: e.grade,
        classNumber: e.classNumber,
        studentNumber: e.studentNumber,
        reward: 0,
        penalty: 0,
        net: 0,
      }
      if (e.type === 'reward') {
        existing.reward += e.score
      } else {
        existing.penalty += e.score
      }
      existing.net = existing.reward - existing.penalty
      map.set(e.studentId, existing)
    }
    return [...map.values()].sort((a, b) => {
      if (a.classNumber !== b.classNumber) return a.classNumber - b.classNumber
      return a.studentNumber - b.studentNumber
    })
  }, [entries])

  return (
    <table className="w-full text-xs">
      <thead>
        <tr style={{ borderBottom: '1px solid var(--admin-border)', backgroundColor: 'var(--admin-bg)' }}>
          {['학년', '반', '번호', '이름', '상점', '벌점', '순점수'].map((h) => (
            <th key={h} className="px-3 py-3 text-left font-semibold" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text-muted)' }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {studentMap.map((s) => (
          <tr key={`${s.school}-${s.classNumber}-${s.studentNumber}`} style={{ borderBottom: '1px solid var(--admin-border)' }}>
            <td className="px-3 py-2.5" style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--admin-text-muted)' }}>{s.grade ?? '—'}</td>
            <td className="px-3 py-2.5" style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--admin-text-muted)' }}>{s.classNumber}</td>
            <td className="px-3 py-2.5" style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--admin-text-muted)' }}>{s.studentNumber}</td>
            <td className="px-3 py-2.5 font-medium" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text)' }}>{s.name}</td>
            <td className="px-3 py-2.5 font-semibold" style={{ fontFamily: 'var(--font-space-grotesk)', color: '#16a34a' }}>+{s.reward}</td>
            <td className="px-3 py-2.5 font-semibold" style={{ fontFamily: 'var(--font-space-grotesk)', color: '#dc2626' }}>-{s.penalty}</td>
            <td
              className="px-3 py-2.5 font-bold"
              style={{
                fontFamily: 'var(--font-space-grotesk)',
                color: s.net >= 0 ? '#16a34a' : '#dc2626',
              }}
            >
              {s.net >= 0 ? '+' : ''}{s.net}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ─── 학급별 보고서 테이블 ─────────────────────────────────────────────────────

function ClassReportTable({ entries }: { entries: SchoolMileageHistoryItem[] }) {
  const classMap = useMemo(() => {
    const map = new Map<number, { classNumber: number; studentIds: Set<string>; reward: number; penalty: number }>()
    for (const e of entries) {
      const existing = map.get(e.classNumber) ?? { classNumber: e.classNumber, studentIds: new Set(), reward: 0, penalty: 0 }
      existing.studentIds.add(e.studentId)
      if (e.type === 'reward') existing.reward += e.score
      else existing.penalty += e.score
      map.set(e.classNumber, existing)
    }
    return [...map.values()]
      .map((c) => ({ ...c, net: c.reward - c.penalty, studentCount: c.studentIds.size }))
      .sort((a, b) => a.classNumber - b.classNumber)
  }, [entries])

  return (
    <table className="w-full text-xs">
      <thead>
        <tr style={{ borderBottom: '1px solid var(--admin-border)', backgroundColor: 'var(--admin-bg)' }}>
          {['반', '학생 수', '상점 합계', '벌점 합계', '순점수 합', '1인 평균'].map((h) => (
            <th key={h} className="px-3 py-3 text-left font-semibold" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text-muted)' }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {classMap.map((c) => {
          const avg = c.studentCount > 0 ? Math.round((c.net / c.studentCount) * 10) / 10 : 0
          return (
            <tr key={c.classNumber} style={{ borderBottom: '1px solid var(--admin-border)' }}>
              <td className="px-3 py-2.5 font-semibold" style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--admin-text)' }}>{c.classNumber}반</td>
              <td className="px-3 py-2.5" style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--admin-text-muted)' }}>{c.studentCount}명</td>
              <td className="px-3 py-2.5 font-semibold" style={{ fontFamily: 'var(--font-space-grotesk)', color: '#16a34a' }}>+{c.reward}</td>
              <td className="px-3 py-2.5 font-semibold" style={{ fontFamily: 'var(--font-space-grotesk)', color: '#dc2626' }}>-{c.penalty}</td>
              <td className="px-3 py-2.5 font-bold" style={{ fontFamily: 'var(--font-space-grotesk)', color: c.net >= 0 ? '#16a34a' : '#dc2626' }}>
                {c.net >= 0 ? '+' : ''}{c.net}
              </td>
              <td className="px-3 py-2.5" style={{ fontFamily: 'var(--font-space-grotesk)', color: avg >= 0 ? '#16a34a' : '#dc2626' }}>
                {avg >= 0 ? '+' : ''}{avg}
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

// ─── 전체 내역 테이블 ────────────────────────────────────────────────────────

function AllEntriesTable({ entries }: { entries: SchoolMileageHistoryItem[] }) {
  return (
    <table className="w-full text-xs">
      <thead>
        <tr style={{ borderBottom: '1px solid var(--admin-border)', backgroundColor: 'var(--admin-bg)' }}>
          {['반', '번호', '이름', '유형', '카테고리', '항목', '점수', '일시', '담당교사'].map((h) => (
            <th key={h} className="px-3 py-3 text-left font-semibold" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text-muted)' }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {entries.map((e) => (
          <tr key={e.id} style={{ borderBottom: '1px solid var(--admin-border)' }}>
            <td className="px-3 py-2" style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--admin-text-muted)' }}>{e.classNumber}</td>
            <td className="px-3 py-2" style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--admin-text-muted)' }}>{e.studentNumber}</td>
            <td className="px-3 py-2 font-medium" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text)' }}>{e.studentName}</td>
            <td className="px-3 py-2">
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{
                  backgroundColor: e.type === 'reward' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
                  color: e.type === 'reward' ? '#16a34a' : '#dc2626',
                }}
              >
                {e.type === 'reward' ? '상점' : '벌점'}
              </span>
            </td>
            <td className="px-3 py-2" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text-muted)' }}>{e.ruleCategory}</td>
            <td className="px-3 py-2 max-w-[120px] truncate" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text)' }}>{e.ruleName}</td>
            <td className="px-3 py-2 font-semibold" style={{ fontFamily: 'var(--font-space-grotesk)', color: e.type === 'reward' ? '#16a34a' : '#dc2626' }}>
              {e.type === 'reward' ? '+' : '-'}{e.score}
            </td>
            <td className="px-3 py-2 whitespace-nowrap" style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--admin-text-muted)' }}>
              {new Date(e.awardedAt).toLocaleDateString('ko-KR')}
            </td>
            <td className="px-3 py-2" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text-muted)' }}>{e.teacherName}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────

export default function SchoolMileageReport() {
  const [reportType, setReportType] = useState<ReportType>('student')
  const [filterSchool, setFilterSchool] = useState<SchoolCode | ''>('')
  const [filterGrade, setFilterGrade] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [previewEntries, setPreviewEntries] = useState<SchoolMileageHistoryItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [hasPreview, setHasPreview] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  const abortRef = useRef<AbortController | null>(null)

  const handlePreview = useCallback(async () => {
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl

    setIsPreviewing(true)
    setPreviewError(null)

    try {
      const params = new URLSearchParams({ pageSize: '500', page: '1' })
      if (filterSchool) params.set('school', filterSchool)
      if (filterGrade) params.set('year', filterGrade)
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)

      const res = await fetch(`/api/teacher/school-mileage/entries?${params.toString()}`, {
        signal: ctrl.signal,
        cache: 'no-store',
      })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        setPreviewError(data?.message ?? '데이터를 불러오지 못했습니다.')
        setPreviewEntries([])
      } else {
        setPreviewEntries(Array.isArray(data?.items) ? data.items : [])
        setTotalCount(data?.totalCount ?? 0)
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') {
        setPreviewError('미리보기 조회 중 문제가 발생했습니다.')
      }
    } finally {
      setIsPreviewing(false)
      setHasPreview(true)
    }
  }, [filterSchool, filterGrade, startDate, endDate])

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  useEffect(() => {
    return () => { abortRef.current?.abort() }
  }, [])

  const reportTitle = useMemo(() => {
    const parts: string[] = []
    if (filterSchool) parts.push(getSchoolLabel(filterSchool))
    if (filterGrade) parts.push(`${filterGrade}학년`)
    if (startDate || endDate) parts.push(`${startDate || '시작'} ~ ${endDate || '현재'}`)
    return [REPORT_TYPE_LABELS[reportType], ...parts].join(' · ')
  }, [reportType, filterSchool, filterGrade, startDate, endDate])

  return (
    <div className="space-y-4">
      {/* 보고서 설정 카드 */}
      <Card className="no-print">
        <SectionHeader
          title="보고서 출력"
          subtitle="조건을 설정하고 미리보기를 확인한 후 인쇄하세요. 최대 500건까지 조회됩니다."
        />

        <div className="mt-5 space-y-4">
          {/* 보고서 유형 */}
          <div>
            <p className="mb-2 text-xs font-semibold" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text-muted)' }}>
              보고서 유형
            </p>
            <div className="flex gap-3">
              {(['student', 'class', 'all'] as ReportType[]).map((type) => (
                <label
                  key={type}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs transition-colors"
                  style={{
                    fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                    borderColor: reportType === type ? 'var(--admin-accent)' : 'var(--admin-border)',
                    backgroundColor: reportType === type ? 'var(--admin-accent-bg)' : 'transparent',
                    color: reportType === type ? 'var(--admin-accent)' : 'var(--admin-text)',
                  }}
                >
                  <input
                    type="radio"
                    name="reportType"
                    value={type}
                    checked={reportType === type}
                    onChange={() => setReportType(type)}
                    className="sr-only"
                  />
                  {REPORT_TYPE_LABELS[type]}
                </label>
              ))}
            </div>
          </div>

          {/* 필터 */}
          <div>
            <p className="mb-2 text-xs font-semibold" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text-muted)' }}>
              조회 조건
            </p>
            <FilterRow>
              <select
                value={filterSchool}
                onChange={(e) => setFilterSchool(e.target.value as SchoolCode | '')}
                className="rounded-lg border px-3 py-2 text-xs outline-none"
                style={inputStyle}
              >
                <option value="">전체 학교</option>
                {SCHOOL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>

              <select
                value={filterGrade}
                onChange={(e) => setFilterGrade(e.target.value)}
                className="rounded-lg border px-3 py-2 text-xs outline-none"
                style={inputStyle}
              >
                <option value="">전체 학년</option>
                <option value="1">1학년</option>
                <option value="2">2학년</option>
                <option value="3">3학년</option>
              </select>

              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-lg border px-3 py-2 text-xs outline-none"
                style={inputStyle}
              />
              <span className="text-xs" style={{ color: 'var(--admin-text-muted)' }}>~</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-lg border px-3 py-2 text-xs outline-none"
                style={inputStyle}
              />
            </FilterRow>
          </div>

          {/* 버튼 */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { void handlePreview() }}
              disabled={isPreviewing}
              className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-medium transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                backgroundColor: 'var(--admin-accent)',
                color: '#fff',
              }}
            >
              <EyeIcon />
              {isPreviewing ? '불러오는 중...' : '미리보기'}
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={!hasPreview || previewEntries.length === 0}
              className="flex items-center gap-1.5 rounded-lg border px-4 py-2 text-xs font-medium transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
              style={{
                fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                borderColor: 'var(--admin-border)',
                color: 'var(--admin-text)',
                backgroundColor: 'var(--admin-sidebar-bg)',
              }}
            >
              <PrintIcon />
              인쇄
            </button>
          </div>
        </div>
      </Card>

      {previewError && <NoticeBox type="error" message={previewError} />}

      {/* 미리보기 영역 (print-area) */}
      <div className="print-area">
        {!hasPreview && !isPreviewing && (
          <Card>
            <ListEmptyState
              icon={<FileIcon />}
              title="미리보기 없음"
              description="조건을 설정하고 미리보기 버튼을 클릭하세요."
            />
          </Card>
        )}

        {isPreviewing && (
          <Card>
            <LoadingSpinner />
          </Card>
        )}

        {hasPreview && !isPreviewing && previewEntries.length === 0 && !previewError && (
          <Card>
            <ListEmptyState
              icon={<FileIcon />}
              title="데이터가 없습니다"
              description="다른 조건으로 다시 조회해 보세요."
            />
          </Card>
        )}

        {hasPreview && !isPreviewing && previewEntries.length > 0 && (
          <Card className="overflow-hidden p-0">
            {/* 보고서 헤더 */}
            <div className="flex items-start justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--admin-border)' }}>
              <div>
                <SectionTitle>{reportTitle}</SectionTitle>
                <p className="text-xs" style={{ fontFamily: 'var(--font-space-grotesk)', color: 'var(--admin-text-muted)' }}>
                  총 {previewEntries.length}건
                  {totalCount > 500 && (
                    <span className="ml-2" style={{ color: '#dc2626' }}>
                      (전체 {totalCount}건 중 500건 표시)
                    </span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={handlePrint}
                className="no-print flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs transition-opacity hover:opacity-70"
                style={{
                  fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                  borderColor: 'var(--admin-border)',
                  color: 'var(--admin-text-muted)',
                }}
              >
                <PrintIcon />
                인쇄
              </button>
            </div>

            <div className="overflow-x-auto">
              {reportType === 'student' && <StudentReportTable entries={previewEntries} />}
              {reportType === 'class' && <ClassReportTable entries={previewEntries} />}
              {reportType === 'all' && <AllEntriesTable entries={previewEntries} />}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
