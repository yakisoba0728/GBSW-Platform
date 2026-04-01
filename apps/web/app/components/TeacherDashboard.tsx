'use client'

import { useState, useRef, useEffect } from 'react'
import DashboardLayout, { type DashboardNavItem } from './DashboardLayout'

/* ── 한국어 초성 검색 유틸 ── */
const CHOSEONG = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ']
function getChoseong(char: string): string {
  const code = char.charCodeAt(0) - 0xac00
  if (code < 0 || code > 11171) return char
  return CHOSEONG[Math.floor(code / 588)]
}
/**
 * 한국어 초성/부분 문자열 검색
 * - 일반 텍스트: 포함 여부 체크 (예: "김동" → "김동현" 매칭)
 * - 초성만 입력 시: 텍스트의 초성과 비교 (예: "ㄱㄷ" → "김동현" 매칭)
 * - 혼합 (예: "김ㄷ"): 음절 단위로 초성/전체 문자 비교
 */
function koreanIncludes(text: string, query: string): boolean {
  const q = query.trim()
  if (!q) return true
  if (text.includes(q)) return true
  const textChars = Array.from(text)
  const queryChars = Array.from(q)
  outer: for (let ti = 0; ti <= textChars.length - queryChars.length; ti++) {
    for (let qi = 0; qi < queryChars.length; qi++) {
      const qc = queryChars[qi]
      const tc = textChars[ti + qi]
      const isQChoseong = /^[ㄱ-ㅎ]$/.test(qc)
      if (isQChoseong) {
        if (getChoseong(tc) !== qc) continue outer
      } else {
        if (tc !== qc) continue outer
      }
    }
    return true
  }
  return false
}

const NAV_ITEMS: DashboardNavItem[] = [
  {
    id: 'home',
    label: '홈',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: 'mileage',
    label: '그린 마일리지',
    section: '학생 관리',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <polyline points="9 12 11 14 15 10" />
      </svg>
    ),
    children: [
      { id: 'mileage-grant', label: '상벌점 부여' },
      { id: 'mileage-history', label: '상벌점 내역' },
      { id: 'mileage-student', label: '학생별 조회' },
      { id: 'mileage-stats', label: '통계 보기' },
      { id: 'mileage-class', label: '학급별 현황' },
      { id: 'mileage-rules', label: '상벌점 항목 관리' },
      { id: 'mileage-report', label: '보고서 출력' },
    ],
  },
]

/* ── 공통 카드 래퍼 ── */
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl border p-5 ${className}`}
      style={{
        backgroundColor: 'var(--admin-sidebar-bg)',
        borderColor: 'var(--admin-border)',
      }}
    >
      {children}
    </div>
  )
}

/* ── 섹션 제목 ── */
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-sm font-semibold mb-4"
      style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text)' }}
    >
      {children}
    </h2>
  )
}

/* ── 입력 공통 스타일 ── */
const inputStyle: React.CSSProperties = {
  fontFamily: 'var(--font-noto-sans-kr), sans-serif',
  backgroundColor: 'var(--admin-bg)',
  borderColor: 'var(--admin-border)',
  color: 'var(--admin-text)',
  fontSize: '0.8rem',
}

/* ── 뱃지 ── */
function Badge({ type, children }: { type: 'reward' | 'penalty'; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium"
      style={{
        backgroundColor: type === 'reward' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
        color: type === 'reward' ? '#16a34a' : '#dc2626',
      }}
    >
      {children}
    </span>
  )
}

/* ── 상벌점 부여용 데이터 ── */
const GRANT_STUDENTS = [
  { studentId: '20241001', name: '김지훈', school: '경북소프트웨어고', year: 2, cls: 3, num: 7 },
  { studentId: '20241002', name: '박서연', school: '경북소프트웨어고', year: 1, cls: 2, num: 3 },
  { studentId: '20241003', name: '오태양', school: '경북소프트웨어고', year: 3, cls: 1, num: 12 },
  { studentId: '20241004', name: '한예린', school: '경북소프트웨어고', year: 2, cls: 1, num: 19 },
  { studentId: '20241005', name: '신도윤', school: '경북소프트웨어고', year: 1, cls: 4, num: 5 },
  { studentId: '20241006', name: '이수진', school: '경북소프트웨어고', year: 3, cls: 2, num: 8 },
  { studentId: '20241007', name: '최민준', school: '경북소프트웨어고', year: 2, cls: 4, num: 1 },
  { studentId: '20241008', name: '정하은', school: '경북소프트웨어고', year: 1, cls: 1, num: 14 },
  { studentId: '20241009', name: '윤서준', school: '경북소프트웨어고', year: 3, cls: 3, num: 6 },
  { studentId: '20241010', name: '강다은', school: '경북소프트웨어고', year: 1, cls: 3, num: 2 },
  { studentId: '20241011', name: '임재현', school: '경북소프트웨어고', year: 2, cls: 2, num: 11 },
  { studentId: '20241012', name: '송지아', school: '경북소프트웨어고', year: 3, cls: 4, num: 9 },
  { studentId: '20230101', name: '류현우', school: '병설중', year: 1, cls: 1, num: 4 },
  { studentId: '20230102', name: '조민서', school: '병설중', year: 2, cls: 2, num: 7 },
  { studentId: '20230103', name: '백지훈', school: '병설중', year: 3, cls: 1, num: 13 },
  { studentId: '20230104', name: '황소연', school: '병설중', year: 1, cls: 2, num: 2 },
  { studentId: '20230105', name: '안도현', school: '병설중', year: 2, cls: 1, num: 10 },
  { studentId: '20230106', name: '남유진', school: '병설중', year: 3, cls: 2, num: 15 },
]

const GRANT_RULES = [
  { label: '봉사활동 참여', type: 'reward' as const, score: 3 },
  { label: '교내 대회 수상', type: 'reward' as const, score: 5 },
  { label: '학급 임원 활동', type: 'reward' as const, score: 2 },
  { label: '결석', type: 'penalty' as const, score: 3 },
  { label: '수업 태도 불량', type: 'penalty' as const, score: 2 },
]

type GrantRow = {
  uid: number
  studentId: string
  name: string
  grade: string
  num: number
  type: 'reward' | 'penalty' | ''
  item: string
  score: number | ''
  reason: string
}


type GrantStudent = typeof GRANT_STUDENTS[0]

/* ── 학생 추가 모달 ── */
function AddStudentModal({
  addedIds,
  onConfirm,
  onClose,
}: {
  addedIds: Set<string>
  onConfirm: (students: GrantStudent[]) => void
  onClose: () => void
}) {
  const [filterSchool, setFilterSchool] = useState('')
  const [filterYear, setFilterYear] = useState('')
  const [filterCls, setFilterCls] = useState('')
  const [filterName, setFilterName] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const schools = Array.from(new Set(GRANT_STUDENTS.map((s) => s.school)))
  const years = [1, 2, 3]
  const classes = [1, 2, 3, 4]

  const filtered = GRANT_STUDENTS.filter((s) => {
    if (filterSchool && s.school !== filterSchool) return false
    if (filterYear && s.year !== Number(filterYear)) return false
    if (filterCls && s.cls !== Number(filterCls)) return false
    if (filterName.trim() && !koreanIncludes(s.name, filterName)) return false
    return true
  })

  function toggleOne(id: string) {
    if (addedIds.has(id)) return
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const selectableFiltered = filtered.filter((s) => !addedIds.has(s.studentId))
  const allChecked = selectableFiltered.length > 0 && selectableFiltered.every((s) => selected.has(s.studentId))

  function toggleAll() {
    if (allChecked) {
      setSelected((prev) => {
        const next = new Set(prev)
        selectableFiltered.forEach((s) => next.delete(s.studentId))
        return next
      })
    } else {
      setSelected((prev) => {
        const next = new Set(prev)
        selectableFiltered.forEach((s) => next.add(s.studentId))
        return next
      })
    }
  }

  function handleConfirm() {
    const students = GRANT_STUDENTS.filter((s) => selected.has(s.studentId))
    onConfirm(students)
  }

  return (
    <>
      <style>{`
        @keyframes modal-backdrop-in {
          from { opacity: 0 }
          to   { opacity: 1 }
        }
        @keyframes modal-panel-in {
          from { opacity: 0; transform: translateY(16px) scale(0.97) }
          to   { opacity: 1; transform: translateY(0)    scale(1)    }
        }
        @keyframes modal-panel-in-mobile {
          from { opacity: 0; transform: translateY(24px) }
          to   { opacity: 1; transform: translateY(0)    }
        }
        .modal-row-item { transition: background-color 0.13s ease, opacity 0.13s ease; }
        .modal-row-item:hover:not([data-disabled='true']) { background-color: rgba(59,130,246,0.04); }
        .modal-btn { transition: background-color 0.15s ease, opacity 0.15s ease; }
        .modal-select { transition: border-color 0.15s ease; }
        .modal-select:focus { border-color: var(--admin-accent); }
      `}</style>

      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center p-0 sm:p-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.45)', animation: 'modal-backdrop-in 0.18s ease' }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <div
          className="w-full sm:max-w-lg sm:mx-auto rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col"
          style={{
            backgroundColor: 'var(--admin-sidebar-bg)',
            maxHeight: '90vh',
            animation: 'modal-panel-in 0.24s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          {/* 모달 헤더 */}
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--admin-border)' }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--admin-text)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
                대상 학생 추가
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--admin-text-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
                추가할 학생을 선택하세요
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="modal-btn rounded-full w-7 h-7 flex items-center justify-center text-sm leading-none"
              style={{ color: 'var(--admin-text-muted)', backgroundColor: 'var(--admin-bg)' }}
              aria-label="닫기"
            >
              ✕
            </button>
          </div>

          {/* 필터 */}
          <div className="px-5 py-3 space-y-2" style={{ borderBottom: '1px solid var(--admin-border)' }}>
            {/* select 3개 */}
            <div className="flex flex-wrap gap-2">
              <select
                value={filterSchool}
                onChange={(e) => setFilterSchool(e.target.value)}
                className="modal-select flex-1 min-w-[100px] rounded-lg border px-3 py-1.5 text-xs outline-none"
                style={inputStyle}
              >
                <option value="">전체 학교</option>
                {schools.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="modal-select flex-1 min-w-[80px] rounded-lg border px-3 py-1.5 text-xs outline-none"
                style={inputStyle}
              >
                <option value="">전체 학년</option>
                {years.map((y) => <option key={y} value={y}>{y}학년</option>)}
              </select>
              <select
                value={filterCls}
                onChange={(e) => setFilterCls(e.target.value)}
                className="modal-select flex-1 min-w-[70px] rounded-lg border px-3 py-1.5 text-xs outline-none"
                style={inputStyle}
              >
                <option value="">전체 반</option>
                {classes.map((c) => <option key={c} value={c}>{c}반</option>)}
              </select>
            </div>
            {/* 이름 검색 */}
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ color: 'var(--admin-text-muted)' }}
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder="이름 검색"
                className="modal-select w-full rounded-lg border pl-8 pr-3 py-1.5 text-xs outline-none"
                style={inputStyle}
              />
            </div>
          </div>

          {/* 전체 선택 행 */}
          <div
            className="flex items-center gap-3 px-5 py-2.5"
            onClick={toggleAll}
            style={{ borderBottom: '1px solid var(--admin-border)', backgroundColor: 'var(--admin-bg)', cursor: selectableFiltered.length === 0 ? 'default' : 'pointer' }}
          >
            <span
              className="flex items-center justify-center rounded-md shrink-0"
              style={{
                width: 16, height: 16,
                border: `1.5px solid ${allChecked ? 'var(--admin-accent)' : 'var(--admin-border)'}`,
                backgroundColor: allChecked ? 'var(--admin-accent)' : 'transparent',
                transition: 'background-color 0.15s ease, border-color 0.15s ease',
              }}
            >
              {allChecked && (
                <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="2,6 5,9 10,3" />
                </svg>
              )}
            </span>
            <span className="text-xs" style={{ color: 'var(--admin-text-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
              전체 선택
            </span>
            <span
              className="ml-auto text-[11px] font-medium px-2 py-0.5 rounded-full"
              style={{ backgroundColor: 'var(--admin-border)', color: 'var(--admin-text-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
            >
              {filtered.length}명
            </span>
          </div>

          {/* 학생 목록 */}
          <div className="flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 gap-2">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--admin-border)' }} aria-hidden="true">
                  <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <p className="text-xs" style={{ color: 'var(--admin-text-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
                  해당 조건의 학생이 없습니다.
                </p>
              </div>
            ) : (
              filtered.map((s, i) => {
                const alreadyAdded = addedIds.has(s.studentId)
                const isSelected = selected.has(s.studentId)
                return (
                  <label
                    key={s.studentId}
                    className="modal-row-item flex items-center gap-3 px-5 py-3"
                    data-disabled={alreadyAdded ? 'true' : 'false'}
                    style={{
                      borderBottom: i < filtered.length - 1 ? '1px solid var(--admin-border)' : 'none',
                      opacity: alreadyAdded ? 0.45 : 1,
                      cursor: alreadyAdded ? 'default' : 'pointer',
                      backgroundColor: isSelected ? 'rgba(59,130,246,0.07)' : 'transparent',
                    }}
                  >
                    {/* 커스텀 체크박스 */}
                    <span
                      className="flex items-center justify-center rounded-md shrink-0"
                      style={{
                        width: 16, height: 16,
                        border: `1.5px solid ${isSelected || alreadyAdded ? 'var(--admin-accent)' : 'var(--admin-border)'}`,
                        backgroundColor: isSelected || alreadyAdded ? 'var(--admin-accent)' : 'transparent',
                        transition: 'background-color 0.15s ease, border-color 0.15s ease',
                      }}
                    >
                      {(isSelected || alreadyAdded) && (
                        <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <polyline points="2,6 5,9 10,3" />
                        </svg>
                      )}
                    </span>
                    <input
                      type="checkbox"
                      checked={isSelected || alreadyAdded}
                      onChange={() => toggleOne(s.studentId)}
                      disabled={alreadyAdded}
                      className="sr-only"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium leading-tight" style={{ color: 'var(--admin-text)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
                        {s.name}
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--admin-text-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
                        {s.year}학년 {s.cls}반 {s.num}번
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px]" style={{ color: 'var(--admin-text-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
                        {s.school}
                      </span>
                      {alreadyAdded && (
                        <span
                          className="text-[11px] font-medium px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: 'rgba(59,130,246,0.1)', color: 'var(--admin-accent)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
                        >
                          추가됨
                        </span>
                      )}
                    </div>
                  </label>
                )
              })
            )}
          </div>

          {/* 모달 푸터 */}
          <div className="flex items-center justify-between px-5 py-4 gap-3" style={{ borderTop: '1px solid var(--admin-border)' }}>
            <span className="text-xs font-medium" style={{ color: selected.size > 0 ? 'var(--admin-accent)' : 'var(--admin-text-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif', transition: 'color 0.15s ease' }}>
              {selected.size > 0 ? `${selected.size}명 선택됨` : '학생을 선택하세요'}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="modal-btn px-4 py-2 rounded-lg text-xs font-medium"
                style={{ border: '1px solid var(--admin-border)', color: 'var(--admin-text-muted)', backgroundColor: 'transparent', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={selected.size === 0}
                className="modal-btn px-4 py-2 rounded-lg text-xs font-medium"
                style={{
                  backgroundColor: selected.size === 0 ? 'var(--admin-border)' : 'var(--admin-accent)',
                  color: selected.size === 0 ? 'var(--admin-text-muted)' : '#fff',
                  fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                  cursor: selected.size === 0 ? 'default' : 'pointer',
                }}
              >
                추가하기 ({selected.size}명)
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

/* ──────────────────────────────────── 상벌점 부여 확인 모달 ── */
function ConfirmGrantModal({
  rows,
  onConfirm,
  onClose,
}: {
  rows: GrantRow[]
  onConfirm: () => void
  onClose: () => void
}) {
  const [countdown, setCountdown] = useState(5)
  const isReady = countdown <= 0
  const circumference = 50.27

  // 숫자 카운트다운: 1초마다 독립 tick
  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  // 원형 프로그레스: CSS @keyframes 5초 연속 애니메이션 (숫자 tick과 분리)
  // → stroke-dashoffset이 circumference → 0 으로 단번에 흘러감

  return (
    <>
    <style>{`
      @keyframes grant-ring {
        from { stroke-dashoffset: ${circumference}; }
        to   { stroke-dashoffset: 0; }
      }
    `}</style>
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl flex flex-col"
        style={{
          backgroundColor: 'var(--admin-sidebar-bg)',
          border: '1px solid var(--admin-border)',
          maxHeight: '85vh',
          boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
        }}
      >
        {/* 헤더 */}
        <div className="px-6 pt-6 pb-4 flex-shrink-0" style={{ borderBottom: '1px solid var(--admin-border)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text)' }}>
                상벌점 부여 확인
              </h3>
              <p className="text-xs mt-1" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text-muted)' }}>
                아래 내용을 확인하고 최종 적용해 주세요.
              </p>
            </div>
            <span
              className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
              style={{ backgroundColor: 'rgba(59,130,246,0.1)', color: 'var(--admin-accent)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
            >
              총 {rows.length}명
            </span>
          </div>
        </div>

        {/* 테이블 */}
        <div className="overflow-y-auto overflow-x-auto flex-1" style={{ scrollbarWidth: 'thin' }}>
          <table className="w-full text-xs" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--admin-border)', backgroundColor: 'var(--admin-bg)' }}>
                {['이름', '학년/반/번호', '구분', '항목', '점수', '사유'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-left font-semibold"
                    style={{ color: 'var(--admin-text-muted)', whiteSpace: 'nowrap' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const isReward = row.type === 'reward'
                const isPenalty = row.type === 'penalty'
                return (
                  <tr
                    key={row.uid}
                    style={{
                      borderBottom: i < rows.length - 1 ? '1px solid var(--admin-border)' : 'none',
                      backgroundColor: i % 2 === 1 ? 'rgba(0,0,0,0.018)' : 'transparent',
                    }}
                  >
                    <td className="px-4 py-3 font-semibold" style={{ color: 'var(--admin-text)', whiteSpace: 'nowrap' }}>{row.name}</td>
                    <td className="px-4 py-3" style={{ color: 'var(--admin-text-muted)', whiteSpace: 'nowrap' }}>{row.grade}반 · {row.num}번</td>
                    <td className="px-4 py-3">
                      {row.type ? (
                        <Badge type={row.type}>{isReward ? '상점' : '벌점'}</Badge>
                      ) : (
                        <span style={{ color: 'var(--admin-text-muted)' }}>—</span>
                      )}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--admin-text)', whiteSpace: 'nowrap' }}>{row.item || <span style={{ color: 'var(--admin-text-muted)' }}>—</span>}</td>
                    <td className="px-4 py-3 font-bold" style={{ color: isReward ? '#16a34a' : isPenalty ? '#dc2626' : 'var(--admin-text-muted)', whiteSpace: 'nowrap' }}>
                      {row.score !== '' ? `${isReward ? '+' : '−'}${row.score}점` : <span style={{ color: 'var(--admin-text-muted)' }}>—</span>}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--admin-text-muted)' }}>{row.reason || <span>—</span>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* 푸터 */}
        <div
          className="px-6 py-4 flex items-center justify-end gap-3 flex-shrink-0"
          style={{ borderTop: '1px solid var(--admin-border)' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 hover:bg-black/[0.05] dark:hover:bg-white/[0.06]"
            style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text-muted)', border: '1px solid var(--admin-border)' }}
          >
            취소
          </button>
          <button
            type="button"
            disabled={!isReady}
            onClick={isReady ? onConfirm : undefined}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
            style={{
              fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              backgroundColor: 'var(--admin-accent)',
              color: '#fff',
              opacity: isReady ? 1 : 0.7,
              cursor: isReady ? 'pointer' : 'not-allowed',
            }}
          >
            {isReady ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
                최종 확인
              </>
            ) : (
              <>
                <svg viewBox="0 0 20 20" width={18} height={18} aria-hidden="true" style={{ flexShrink: 0 }}>
                  <circle cx="10" cy="10" r="8" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                  <circle
                    cx="10" cy="10" r="8" fill="none"
                    stroke="#fff" strokeWidth="2"
                    strokeDasharray={circumference}
                    strokeLinecap="round"
                    transform="rotate(-90 10 10)"
                    style={{ animation: 'grant-ring 5s linear forwards' }}
                  />
                </svg>
                확인 ({countdown}초)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
    </>
  )
}

/* ──────────────────────────────────── A. 상벌점 부여 ── */
function MileageGrant() {
  const [rows, setRows] = useState<GrantRow[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const uidRef = useRef(0)

  const addedIds = new Set(rows.map((r) => r.studentId))

  function handleModalConfirm(students: GrantStudent[]) {
    setRows((prev) => [
      ...prev,
      ...students.map((s) => ({
        uid: ++uidRef.current,
        studentId: s.studentId,
        name: s.name,
        grade: `${s.year}-${s.cls}`,
        num: s.num,
        type: '' as 'reward' | 'penalty' | '',
        item: '',
        score: '' as number | '',
        reason: '',
      })),
    ])
    setShowModal(false)
  }

  function removeRow(uid: number) {
    setRows((prev) => prev.filter((r) => r.uid !== uid))
  }

  function updateRow(uid: number, patch: Partial<GrantRow>) {
    setRows((prev) =>
      prev.map((r) => {
        if (r.uid !== uid) return r
        const updated = { ...r, ...patch }
        if (patch.type !== undefined && patch.type !== r.type) {
          updated.item = ''
          updated.score = ''
        }
        if (patch.item !== undefined) {
          if (patch.item === '') {
            updated.score = ''
          } else {
            const rule = GRANT_RULES.find((rule) => rule.label === patch.item)
            if (rule) updated.score = rule.score
          }
        }
        return updated
      }),
    )
  }

  function applyFirstToAll() {
    if (rows.length < 2) return
    const first = rows[0]
    setRows((prev) =>
      prev.map((r, i) =>
        i === 0 ? r : { ...r, type: first.type, item: first.item, score: first.score, reason: first.reason }
      )
    )
  }

  const allValid = rows.length > 0 && rows.every((r) => r.type !== '' && r.item !== '' && r.score !== '')
  const firstRowReady = rows.length >= 2 && rows[0].type !== '' && rows[0].item !== '' && rows[0].score !== ''

  return (
    <>
      {showModal && (
        <AddStudentModal
          addedIds={addedIds}
          onConfirm={handleModalConfirm}
          onClose={() => setShowModal(false)}
        />
      )}
      {showConfirm && (
        <ConfirmGrantModal
          rows={rows}
          onConfirm={() => { setShowConfirm(false) /* TODO: API 호출 */ }}
          onClose={() => setShowConfirm(false)}
        />
      )}

    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between gap-2">
        <h2
          className="text-sm font-semibold"
          style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif', color: 'var(--admin-text)' }}
        >
          상벌점 부여
        </h2>
        <div className="flex items-center gap-2">
          {rows.length >= 2 && (
            <button
              type="button"
              onClick={firstRowReady ? applyFirstToAll : undefined}
              disabled={!firstRowReady}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 hover:bg-black/[0.04] dark:hover:bg-white/[0.05]"
              style={{ border: '1px solid var(--admin-border)', color: 'var(--admin-text-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif', opacity: firstRowReady ? 1 : 0.45, cursor: firstRowReady ? 'pointer' : 'not-allowed' }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
              모든 학생에 적용
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ backgroundColor: 'var(--admin-accent)', color: '#fff', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            대상 학생 추가하기
          </button>
        </div>
      </div>

      {/* 학생 목록 */}
      <Card>
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--admin-bg)', border: '1.5px dashed var(--admin-border)' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--admin-border)' }} aria-hidden="true">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold" style={{ color: 'var(--admin-text)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>추가된 학생이 없습니다</p>
              <p className="text-[11px] mt-1" style={{ color: 'var(--admin-text-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>위 버튼으로 대상 학생을 추가하세요</p>
            </div>
          </div>
        ) : (
          <>
            {/* 카운터 헤더 */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold" style={{ color: 'var(--admin-text)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
                대상 학생
              </span>
              <span
                className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                style={{ backgroundColor: 'rgba(59,130,246,0.1)', color: 'var(--admin-accent)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
              >
                {rows.length}명
              </span>
            </div>

            {/* 컬럼 헤더 */}
            <div className="grant-row-header hidden sm:flex items-center gap-2 px-3 mb-1">
              <span style={{ width: 120, flexShrink: 0 }} />
              <span className="text-[11px] font-medium flex-shrink-0" style={{ width: 84, color: 'var(--admin-text-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>구분</span>
              <span className="text-[11px] font-medium flex-1" style={{ color: 'var(--admin-text-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>항목</span>
              <span className="text-[11px] font-medium flex-shrink-0" style={{ width: 80, color: 'var(--admin-text-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>점수</span>
              <span className="text-[11px] font-medium flex-1" style={{ color: 'var(--admin-text-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>사유</span>
              <span style={{ width: 30, flexShrink: 0 }} />
            </div>

            {/* 행 목록 */}
            <div className="space-y-2">
              {rows.map((row) => {
                const isReward = row.type === 'reward'
                const isPenalty = row.type === 'penalty'
                const hasType = row.type !== ''
                const scoreColor = isReward ? '#16a34a' : isPenalty ? '#dc2626' : 'var(--admin-text-muted)'
                return (
                  <div
                    key={row.uid}
                    className="flex flex-wrap sm:flex-nowrap items-center gap-2 rounded-xl px-3 py-2.5"
                    style={{ border: '1px solid var(--admin-border)', backgroundColor: 'var(--admin-bg)', transition: 'border-color 0.15s' }}
                  >
                    {/* 학생 정보 */}
                    <div className="flex-shrink-0" style={{ width: 120 }}>
                      <p className="text-xs font-semibold leading-tight truncate" style={{ color: 'var(--admin-text)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
                        {row.name}
                      </p>
                      <p className="text-[11px] mt-0.5" style={{ color: 'var(--admin-text-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
                        {row.grade}반 · {row.num}번
                      </p>
                    </div>

                    {/* 구분 토글 */}
                    <div
                      className="flex rounded-lg overflow-hidden flex-shrink-0"
                      style={{
                        border: `1px solid ${!hasType ? 'rgba(239,68,68,0.35)' : 'var(--admin-border)'}`,
                        height: 32,
                      }}
                    >
                      {(['reward', 'penalty'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => updateRow(row.uid, { type: t })}
                          className="px-2.5 text-xs font-medium"
                          style={{
                            fontFamily: 'var(--font-noto-sans-kr), sans-serif',
                            backgroundColor: row.type === t
                              ? (t === 'reward' ? 'rgba(34,197,94,0.14)' : 'rgba(239,68,68,0.14)')
                              : 'transparent',
                            color: row.type === t
                              ? (t === 'reward' ? '#16a34a' : '#dc2626')
                              : 'var(--admin-text-muted)',
                            transition: 'background-color 0.15s, color 0.15s',
                          }}
                        >
                          {t === 'reward' ? '상점' : '벌점'}
                        </button>
                      ))}
                    </div>

                    {/* 항목 */}
                    <select
                      value={row.item}
                      onChange={(e) => updateRow(row.uid, { item: e.target.value })}
                      disabled={!hasType}
                      className="flex-1 rounded-lg border px-2.5 outline-none"
                      style={{ ...inputStyle, minWidth: 120, height: 32, opacity: hasType ? 1 : 0.45 }}
                    >
                      <option value="">항목 선택</option>
                      {GRANT_RULES.filter((r) => r.type === row.type).map((r) => (
                        <option key={r.label} value={r.label}>{r.label}</option>
                      ))}
                    </select>

                    {/* 점수 */}
                    <div
                      className="flex items-center gap-1 rounded-lg border px-2.5 flex-shrink-0"
                      style={{
                        height: 32,
                        width: 80,
                        borderColor: isReward ? 'rgba(34,197,94,0.4)' : isPenalty ? 'rgba(239,68,68,0.4)' : 'var(--admin-border)',
                        backgroundColor: isReward ? 'rgba(34,197,94,0.07)' : isPenalty ? 'rgba(239,68,68,0.07)' : 'transparent',
                      }}
                    >
                      <span className="text-xs font-bold" style={{ color: scoreColor }}>
                        {isReward ? '+' : isPenalty ? '−' : '·'}
                      </span>
                      <input
                        type="number"
                        value={row.score}
                        min={1}
                        placeholder="0"
                        onChange={(e) => updateRow(row.uid, { score: e.target.value === '' ? '' : Number(e.target.value) })}
                        className="text-xs font-bold text-center outline-none bg-transparent flex-1"
                        style={{ color: scoreColor, fontFamily: 'var(--font-noto-sans-kr), sans-serif', minWidth: 0 }}
                      />
                      <span className="text-[11px]" style={{ color: 'var(--admin-text-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>점</span>
                    </div>

                    {/* 사유 */}
                    <input
                      type="text"
                      value={row.reason}
                      placeholder="사유 입력 (선택)"
                      onChange={(e) => updateRow(row.uid, { reason: e.target.value })}
                      className="flex-1 rounded-lg border px-2.5 outline-none"
                      style={{ ...inputStyle, minWidth: 100, height: 32 }}
                    />

                    {/* 삭제 */}
                    <button
                      type="button"
                      onClick={() => removeRow(row.uid)}
                      className="flex items-center justify-center rounded-lg flex-shrink-0"
                      style={{ width: 30, height: 30, color: 'var(--admin-text-muted)', backgroundColor: 'transparent', transition: 'background-color 0.15s, color 0.15s' }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#dc2626' }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--admin-text-muted)' }}
                      aria-label="삭제"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                        <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                      </svg>
                    </button>
                  </div>
                )
              })}
            </div>

            {/* 전체 부여하기 */}
            <button
              type="button"
              disabled={!allValid}
              onClick={allValid ? () => setShowConfirm(true) : undefined}
              className="w-full mt-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
              style={{ backgroundColor: 'var(--admin-accent)', color: '#fff', height: 44, fontFamily: 'var(--font-noto-sans-kr), sans-serif', opacity: allValid ? 1 : 0.45, cursor: allValid ? 'pointer' : 'not-allowed' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              전체 부여하기 ({rows.length}명)
            </button>
          </>
        )}
      </Card>
    </div>
    </>
  )
}

/* ──────────────────────────────────── B. 상벌점 내역 ── */
const SAMPLE_HISTORY = [
  { id: 1, date: '2026-03-28', student: '김지훈', grade: '2-3', type: 'reward' as const, item: '봉사활동 참여', score: 3, teacher: '이민준' },
  { id: 2, date: '2026-03-27', student: '박서연', grade: '1-2', type: 'penalty' as const, item: '수업 태도 불량', score: 2, teacher: '최수아' },
  { id: 3, date: '2026-03-26', student: '오태양', grade: '3-1', type: 'reward' as const, item: '교내 대회 수상', score: 5, teacher: '이민준' },
  { id: 4, date: '2026-03-25', student: '한예린', grade: '2-1', type: 'penalty' as const, item: '결석', score: 3, teacher: '정하은' },
  { id: 5, date: '2026-03-24', student: '신도윤', grade: '1-4', type: 'reward' as const, item: '학급 임원 활동', score: 2, teacher: '최수아' },
]

function MileageHistory() {
  return (
    <div className="space-y-5">
      <SectionTitle>상벌점 내역</SectionTitle>

      {/* 필터 */}
      <Card>
        <div className="flex flex-wrap gap-3">
          <select className="rounded-lg border px-3 py-1.5 text-xs outline-none" style={inputStyle}>
            <option>전체 구분</option>
            <option>상점</option>
            <option>벌점</option>
          </select>
          <select className="rounded-lg border px-3 py-1.5 text-xs outline-none" style={inputStyle}>
            <option>전체 학년</option>
            <option>1학년</option>
            <option>2학년</option>
            <option>3학년</option>
          </select>
          <input type="date" className="rounded-lg border px-3 py-1.5 text-xs outline-none" style={inputStyle} />
          <span className="flex items-center text-xs" style={{ color: 'var(--admin-text-muted)' }}>~</span>
          <input type="date" className="rounded-lg border px-3 py-1.5 text-xs outline-none" style={inputStyle} />
          <input type="text" placeholder="학생 이름 검색" className="rounded-lg border px-3 py-1.5 text-xs outline-none" style={{ ...inputStyle, minWidth: 130 }} />
        </div>
      </Card>

      {/* 테이블 */}
      <Card className="overflow-x-auto">
        <table className="w-full text-xs" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--admin-border)' }}>
              {['날짜', '학생', '학반', '구분', '항목', '점수', '담당교사'].map((h) => (
                <th key={h} className="pb-2.5 pr-4 text-left font-medium" style={{ color: 'var(--admin-text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SAMPLE_HISTORY.map((row) => (
              <tr key={row.id} style={{ borderBottom: '1px solid var(--admin-border)' }}>
                <td className="py-2.5 pr-4" style={{ color: 'var(--admin-text-muted)' }}>{row.date}</td>
                <td className="py-2.5 pr-4 font-medium" style={{ color: 'var(--admin-text)' }}>{row.student}</td>
                <td className="py-2.5 pr-4" style={{ color: 'var(--admin-text-muted)' }}>{row.grade}</td>
                <td className="py-2.5 pr-4">
                  <Badge type={row.type}>{row.type === 'reward' ? '상점' : '벌점'}</Badge>
                </td>
                <td className="py-2.5 pr-4" style={{ color: 'var(--admin-text)' }}>{row.item}</td>
                <td className="py-2.5 pr-4 font-semibold" style={{ color: row.type === 'reward' ? '#16a34a' : '#dc2626' }}>
                  {row.type === 'reward' ? '+' : '-'}{row.score}
                </td>
                <td className="py-2.5" style={{ color: 'var(--admin-text-muted)' }}>{row.teacher}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

/* ──────────────────────────────────── C. 학생별 조회 ── */
function MileageStudent() {
  return (
    <div className="space-y-5 max-w-2xl">
      <SectionTitle>학생별 조회</SectionTitle>

      <Card>
        <div className="flex gap-2 mb-5">
          <input
            type="text"
            placeholder="학번 또는 이름으로 검색"
            className="flex-1 rounded-lg border px-3 py-2 text-sm outline-none"
            style={inputStyle}
          />
          <button
            type="button"
            className="px-4 py-2 rounded-lg text-xs font-medium"
            style={{ backgroundColor: 'var(--admin-accent)', color: '#fff', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
          >
            조회
          </button>
        </div>

        {/* 학생 요약 카드 */}
        <div className="rounded-lg p-4 mb-4" style={{ backgroundColor: 'var(--admin-bg)', border: '1px solid var(--admin-border)' }}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--admin-text)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>김지훈</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--admin-text-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>2학년 3반 · 학번 20241023</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold" style={{ color: 'var(--admin-accent)' }}>+11</p>
              <p className="text-[11px]" style={{ color: 'var(--admin-text-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>누적 점수</p>
            </div>
          </div>
          <div className="flex gap-4 mt-3">
            <div className="text-center">
              <p className="text-sm font-semibold" style={{ color: '#16a34a' }}>+14</p>
              <p className="text-[10px]" style={{ color: 'var(--admin-text-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>상점</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold" style={{ color: '#dc2626' }}>-3</p>
              <p className="text-[10px]" style={{ color: 'var(--admin-text-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>벌점</p>
            </div>
          </div>
        </div>

        {/* 내역 */}
        <p className="text-xs font-medium mb-2" style={{ color: 'var(--admin-text-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>부여 내역</p>
        <div className="space-y-2">
          {[
            { date: '2026-03-28', type: 'reward' as const, item: '봉사활동 참여', score: 3 },
            { date: '2026-03-20', type: 'reward' as const, item: '교내 대회 수상', score: 5 },
            { date: '2026-03-15', type: 'penalty' as const, item: '결석', score: 3 },
            { date: '2026-03-10', type: 'reward' as const, item: '학급 임원 활동', score: 6 },
          ].map((row, i) => (
            <div key={i} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--admin-border)' }}>
              <div className="flex items-center gap-3">
                <Badge type={row.type}>{row.type === 'reward' ? '상점' : '벌점'}</Badge>
                <span className="text-xs" style={{ color: 'var(--admin-text)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>{row.item}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs" style={{ color: 'var(--admin-text-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>{row.date}</span>
                <span className="text-xs font-semibold" style={{ color: row.type === 'reward' ? '#16a34a' : '#dc2626', minWidth: 28, textAlign: 'right' }}>
                  {row.type === 'reward' ? '+' : '-'}{row.score}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

/* ──────────────────────────────────── D. 통계 보기 ── */
function MileageStats() {
  const stats = [
    { label: '이번 달 상점 부여', value: '247점', sub: '전월 대비 +18%' },
    { label: '이번 달 벌점 부여', value: '83점', sub: '전월 대비 -5%' },
    { label: '최다 상점 항목', value: '봉사활동 참여', sub: '38건' },
    { label: '평균 누적 점수', value: '+6.4점', sub: '전체 학생 기준' },
  ]

  const topStudents = [
    { rank: 1, name: '오태양', grade: '3-1', score: 28 },
    { rank: 2, name: '한예린', grade: '2-1', score: 24 },
    { rank: 3, name: '김지훈', grade: '2-3', score: 21 },
    { rank: 4, name: '신도윤', grade: '1-4', score: 19 },
    { rank: 5, name: '박서연', grade: '1-2', score: 17 },
  ]

  return (
    <div className="space-y-5">
      <SectionTitle>통계 보기</SectionTitle>

      {/* 기간 선택 */}
      <div className="flex gap-2">
        {['이번 달', '이번 학기', '올해'].map((p) => (
          <button
            key={p}
            type="button"
            className="px-3 py-1.5 rounded-lg text-xs border"
            style={{
              fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              backgroundColor: p === '이번 달' ? 'var(--admin-accent-bg)' : 'transparent',
              color: p === '이번 달' ? 'var(--admin-accent)' : 'var(--admin-text-muted)',
              borderColor: p === '이번 달' ? 'var(--admin-accent)' : 'var(--admin-border)',
            }}
          >
            {p}
          </button>
        ))}
      </div>

      {/* 요약 수치 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <p className="text-[11px] mb-1" style={{ color: 'var(--admin-text-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>{s.label}</p>
            <p className="text-lg font-bold" style={{ color: 'var(--admin-text)', fontFamily: 'var(--font-space-grotesk)' }}>{s.value}</p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--admin-text-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>{s.sub}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 상위 학생 */}
        <Card>
          <p className="text-xs font-semibold mb-3" style={{ color: 'var(--admin-text)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>상점 상위 학생 TOP 5</p>
          <div className="space-y-2">
            {topStudents.map((s) => (
              <div key={s.rank} className="flex items-center gap-3">
                <span
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{
                    backgroundColor: s.rank === 1 ? '#f59e0b' : s.rank === 2 ? '#9ca3af' : s.rank === 3 ? '#b45309' : 'var(--admin-border)',
                    color: s.rank <= 3 ? '#fff' : 'var(--admin-text-muted)',
                    fontFamily: 'var(--font-space-grotesk)',
                  }}
                >
                  {s.rank}
                </span>
                <span className="flex-1 text-xs" style={{ color: 'var(--admin-text)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>{s.name}</span>
                <span className="text-[11px]" style={{ color: 'var(--admin-text-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>{s.grade}</span>
                <span className="text-xs font-semibold" style={{ color: '#16a34a', fontFamily: 'var(--font-space-grotesk)', minWidth: 28, textAlign: 'right' }}>+{s.score}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* 항목별 분포 */}
        <Card>
          <p className="text-xs font-semibold mb-3" style={{ color: 'var(--admin-text)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>항목별 부여 현황</p>
          <div className="space-y-3">
            {[
              { label: '봉사활동 참여', count: 38, pct: 78 },
              { label: '교내 대회 수상', count: 21, pct: 43 },
              { label: '학급 임원 활동', count: 15, pct: 31 },
              { label: '결석', count: 12, pct: 25 },
              { label: '수업 태도 불량', count: 8, pct: 16 },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs" style={{ color: 'var(--admin-text)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>{item.label}</span>
                  <span className="text-xs" style={{ color: 'var(--admin-text-muted)', fontFamily: 'var(--font-space-grotesk)' }}>{item.count}건</span>
                </div>
                <div className="h-1.5 rounded-full" style={{ backgroundColor: 'var(--admin-border)' }}>
                  <div className="h-full rounded-full" style={{ width: `${item.pct}%`, backgroundColor: 'var(--admin-accent)' }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

/* ──────────────────────────────────── E. 학급별 현황 ── */
function MileageClass() {
  const classes = [
    { grade: 1, cls: 1, total: 32, avgScore: 8.2, rewardTotal: 312, penaltyTotal: 48, topStudent: '이준혁' },
    { grade: 1, cls: 2, total: 31, avgScore: 6.7, rewardTotal: 287, penaltyTotal: 80, topStudent: '박서연' },
    { grade: 2, cls: 1, total: 30, avgScore: 9.1, rewardTotal: 340, penaltyTotal: 67, topStudent: '한예린' },
    { grade: 2, cls: 3, total: 33, avgScore: 7.4, rewardTotal: 298, penaltyTotal: 55, topStudent: '김지훈' },
    { grade: 3, cls: 1, total: 29, avgScore: 11.2, rewardTotal: 398, penaltyTotal: 73, topStudent: '오태양' },
  ]

  return (
    <div className="space-y-5">
      <SectionTitle>학급별 현황</SectionTitle>

      <div className="flex gap-2 mb-1">
        {['전체', '1학년', '2학년', '3학년'].map((g) => (
          <button
            key={g}
            type="button"
            className="px-3 py-1.5 rounded-lg text-xs border"
            style={{
              fontFamily: 'var(--font-noto-sans-kr), sans-serif',
              backgroundColor: g === '전체' ? 'var(--admin-accent-bg)' : 'transparent',
              color: g === '전체' ? 'var(--admin-accent)' : 'var(--admin-text-muted)',
              borderColor: g === '전체' ? 'var(--admin-accent)' : 'var(--admin-border)',
            }}
          >
            {g}
          </button>
        ))}
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-xs" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--admin-border)' }}>
              {['학반', '학생 수', '평균 점수', '상점 합계', '벌점 합계', '최고 득점 학생'].map((h) => (
                <th key={h} className="pb-2.5 pr-5 text-left font-medium" style={{ color: 'var(--admin-text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {classes.map((c) => (
              <tr key={`${c.grade}-${c.cls}`} style={{ borderBottom: '1px solid var(--admin-border)' }}>
                <td className="py-3 pr-5 font-semibold" style={{ color: 'var(--admin-text)' }}>{c.grade}학년 {c.cls}반</td>
                <td className="py-3 pr-5" style={{ color: 'var(--admin-text-muted)' }}>{c.total}명</td>
                <td className="py-3 pr-5 font-semibold" style={{ color: 'var(--admin-accent)' }}>+{c.avgScore}</td>
                <td className="py-3 pr-5" style={{ color: '#16a34a' }}>+{c.rewardTotal}</td>
                <td className="py-3 pr-5" style={{ color: '#dc2626' }}>-{c.penaltyTotal}</td>
                <td className="py-3" style={{ color: 'var(--admin-text-muted)' }}>{c.topStudent}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

/* ──────────────────────────────────── F. 상벌점 항목 관리 ── */
const SAMPLE_RULES = [
  { id: 1, type: 'reward' as const, category: '봉사', name: '봉사활동 참여', score: 3 },
  { id: 2, type: 'reward' as const, category: '수상', name: '교내 대회 수상', score: 5 },
  { id: 3, type: 'reward' as const, category: '생활', name: '학급 임원 활동', score: 2 },
  { id: 4, type: 'penalty' as const, category: '출결', name: '결석', score: 3 },
  { id: 5, type: 'penalty' as const, category: '생활', name: '수업 태도 불량', score: 2 },
  { id: 6, type: 'penalty' as const, category: '생활', name: '교칙 위반', score: 5 },
]

function MileageRules() {
  return (
    <div className="space-y-5">
      <SectionTitle>상벌점 항목 관리</SectionTitle>

      {/* 추가 폼 */}
      <Card>
        <p className="text-xs font-semibold mb-3" style={{ color: 'var(--admin-text)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>새 항목 추가</p>
        <div className="flex flex-wrap gap-2">
          <select className="rounded-lg border px-3 py-1.5 text-xs outline-none" style={inputStyle}>
            <option>상점</option>
            <option>벌점</option>
          </select>
          <input type="text" placeholder="카테고리 (예: 봉사)" className="rounded-lg border px-3 py-1.5 text-xs outline-none w-32" style={inputStyle} />
          <input type="text" placeholder="항목명" className="flex-1 rounded-lg border px-3 py-1.5 text-xs outline-none min-w-40" style={inputStyle} />
          <input type="number" placeholder="점수" min={1} className="rounded-lg border px-3 py-1.5 text-xs outline-none w-20" style={inputStyle} />
          <button
            type="button"
            className="px-4 py-1.5 rounded-lg text-xs font-medium"
            style={{ backgroundColor: 'var(--admin-accent)', color: '#fff', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
          >
            추가
          </button>
        </div>
      </Card>

      {/* 목록 */}
      <Card className="overflow-x-auto">
        <table className="w-full text-xs" style={{ fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--admin-border)' }}>
              {['구분', '카테고리', '항목명', '점수', ''].map((h, i) => (
                <th key={i} className="pb-2.5 pr-4 text-left font-medium" style={{ color: 'var(--admin-text-muted)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SAMPLE_RULES.map((rule) => (
              <tr key={rule.id} style={{ borderBottom: '1px solid var(--admin-border)' }}>
                <td className="py-2.5 pr-4"><Badge type={rule.type}>{rule.type === 'reward' ? '상점' : '벌점'}</Badge></td>
                <td className="py-2.5 pr-4" style={{ color: 'var(--admin-text-muted)' }}>{rule.category}</td>
                <td className="py-2.5 pr-4" style={{ color: 'var(--admin-text)' }}>{rule.name}</td>
                <td className="py-2.5 pr-4 font-semibold" style={{ color: rule.type === 'reward' ? '#16a34a' : '#dc2626' }}>
                  {rule.type === 'reward' ? '+' : '-'}{rule.score}
                </td>
                <td className="py-2.5">
                  <button type="button" className="text-[11px] px-2 py-0.5 rounded border" style={{ color: 'var(--admin-text-muted)', borderColor: 'var(--admin-border)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}

/* ──────────────────────────────────── I. 보고서 출력 ── */
function MileageReport() {
  return (
    <div className="space-y-5 max-w-xl">
      <SectionTitle>보고서 출력</SectionTitle>

      <Card>
        <div className="space-y-4">
          {/* 보고서 종류 */}
          <div>
            <label className="block text-xs mb-1.5" style={{ color: 'var(--admin-text-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
              보고서 종류
            </label>
            <div className="space-y-1.5">
              {['학생별 상벌점 현황 보고서', '학급별 상벌점 통계 보고서', '기간별 상벌점 내역 보고서'].map((r) => (
                <label key={r} className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: 'var(--admin-text)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
                  <input type="radio" name="reportType" defaultChecked={r.includes('학생별')} style={{ accentColor: 'var(--admin-accent)' }} />
                  {r}
                </label>
              ))}
            </div>
          </div>

          {/* 대상 */}
          <div>
            <label className="block text-xs mb-1.5" style={{ color: 'var(--admin-text-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
              대상 학년/반
            </label>
            <div className="flex gap-2">
              <select className="rounded-lg border px-3 py-1.5 text-xs outline-none" style={inputStyle}>
                <option>전체 학년</option>
                <option>1학년</option>
                <option>2학년</option>
                <option>3학년</option>
              </select>
              <select className="rounded-lg border px-3 py-1.5 text-xs outline-none" style={inputStyle}>
                <option>전체 반</option>
                <option>1반</option>
                <option>2반</option>
                <option>3반</option>
                <option>4반</option>
              </select>
            </div>
          </div>

          {/* 기간 */}
          <div>
            <label className="block text-xs mb-1.5" style={{ color: 'var(--admin-text-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
              기간
            </label>
            <div className="flex items-center gap-2">
              <input type="date" className="rounded-lg border px-3 py-1.5 text-xs outline-none" style={inputStyle} />
              <span className="text-xs" style={{ color: 'var(--admin-text-muted)' }}>~</span>
              <input type="date" className="rounded-lg border px-3 py-1.5 text-xs outline-none" style={inputStyle} />
            </div>
          </div>

          {/* 출력 형식 */}
          <div>
            <label className="block text-xs mb-1.5" style={{ color: 'var(--admin-text-muted)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
              출력 형식
            </label>
            <div className="flex gap-3">
              {['PDF', 'Excel'].map((f) => (
                <label key={f} className="flex items-center gap-1.5 cursor-pointer text-sm" style={{ color: 'var(--admin-text)', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}>
                  <input type="radio" name="format" defaultChecked={f === 'PDF'} style={{ accentColor: 'var(--admin-accent)' }} />
                  {f}
                </label>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2"
            style={{ backgroundColor: 'var(--admin-accent)', color: '#fff', fontFamily: 'var(--font-noto-sans-kr), sans-serif' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            보고서 생성 및 다운로드
          </button>
        </div>
      </Card>
    </div>
  )
}

/* ──────────────────────────────────── 메인 컴포넌트 ── */
export default function TeacherDashboard() {
  return (
    <DashboardLayout roleLabel="교사" navItems={NAV_ITEMS} defaultTab="home">
      {(activeTab) => (
        <div
          className="text-sm"
          style={{
            fontFamily: 'var(--font-noto-sans-kr), sans-serif',
            color: 'var(--admin-text-muted)',
          }}
        >
          {activeTab === 'home' && <p>교사 홈 콘텐츠가 들어올 자리입니다.</p>}
          {activeTab === 'mileage-grant' && <MileageGrant />}
          {activeTab === 'mileage-history' && <MileageHistory />}
          {activeTab === 'mileage-student' && <MileageStudent />}
          {activeTab === 'mileage-stats' && <MileageStats />}
          {activeTab === 'mileage-class' && <MileageClass />}
          {activeTab === 'mileage-rules' && <MileageRules />}
          {activeTab === 'mileage-report' && <MileageReport />}
        </div>
      )}
    </DashboardLayout>
  )
}
