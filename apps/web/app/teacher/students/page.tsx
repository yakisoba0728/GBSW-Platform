'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Button } from '@/app/components/ui/button'

type Student = {
  studentId: string
  school: string
  currentYear: number
  currentClass: number
  currentNumber: number
  majorSubject: string | null
  name: string | null
  phone: string | null
  email: string | null
  hasLinkedPhone: boolean
  hasLinkedEmail: boolean
  isActive: boolean
}

const PAGE_SIZE = 50

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [total, setTotal] = useState(0)
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [yearFilter, setYearFilter] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showBulkModal, setShowBulkModal] = useState(false)
  const fetchAbortRef = useRef<AbortController | null>(null)
  const fetchSeqRef = useRef(0)

  const fetchStudents = useCallback(async () => {
    fetchAbortRef.current?.abort()
    const controller = new AbortController()
    fetchAbortRef.current = controller
    const requestId = fetchSeqRef.current + 1
    fetchSeqRef.current = requestId
    setIsLoading(true)
    setLoadError('')
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (yearFilter) params.set('year', yearFilter)
      if (classFilter) params.set('class', classFilter)
      params.set('page', String(page))
      params.set('limit', String(PAGE_SIZE))
      const res = await fetch(`/api/teacher/students?${params}`, {
        signal: controller.signal,
        cache: 'no-store',
      })
      const data = await res.json().catch(() => null)

      if (fetchSeqRef.current !== requestId || controller.signal.aborted) {
        return
      }

      if (!res.ok) {
        setLoadError(data?.message ?? '학생 목록을 불러오지 못했습니다.')
        return
      }

      setStudents(Array.isArray(data?.students) ? data.students : [])
      setTotal(typeof data?.total === 'number' ? data.total : 0)
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        return
      }

      if (fetchSeqRef.current === requestId) {
        setLoadError('학생 목록을 불러오는 중 오류가 발생했습니다.')
      }
    } finally {
      if (fetchSeqRef.current === requestId) {
        setIsLoading(false)
      }
    }
  }, [classFilter, page, search, yearFilter])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  useEffect(() => {
    void fetchStudents()
    return () => {
      fetchAbortRef.current?.abort()
    }
  }, [fetchStudents])
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages)
    }
  }, [page, totalPages])

  return (
    <div style={{ padding: '24px 32px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--fg)' }}>학생 관리</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="outline" onClick={() => setShowBulkModal(true)}>일괄 생성</Button>
          <Button onClick={() => setShowCreateModal(true)}>단건 생성</Button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <select
          value={yearFilter}
          onChange={(e) => {
            setYearFilter(e.target.value)
            setPage(1)
          }}
          style={selectStyle}
        >
          <option value="">전체 학년</option>
          <option value="1">1학년</option>
          <option value="2">2학년</option>
          <option value="3">3학년</option>
        </select>
        <input
          type="number" min={1} max={99} placeholder="반"
          value={classFilter}
          onChange={(e) => {
            setClassFilter(e.target.value)
            setPage(1)
          }}
          style={{ ...inputStyle, width: 80 }}
        />
        <input
          type="text" placeholder="학번 또는 이름 검색"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
          style={{ ...inputStyle, flex: 1 }}
        />
      </div>

      {loadError ? (
        <div
          style={{
            marginBottom: 12,
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid var(--penalty-border)',
            backgroundColor: 'var(--penalty-subtle)',
            color: 'var(--penalty)',
            fontSize: 13,
          }}
        >
          {loadError}
        </div>
      ) : null}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['학번', '이름', '학년', '반', '번호', '과', '이메일', '전화번호', '상태'].map(h => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--fg-muted)', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={9} style={{ padding: 24, textAlign: 'center', color: 'var(--fg-muted)' }}>불러오는 중...</td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: 24, textAlign: 'center', color: 'var(--fg-muted)' }}>학생이 없습니다.</td></tr>
            ) : students.map(s => (
              <tr
                key={s.studentId}
                onClick={() => setSelectedStudent(s)}
                style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', opacity: s.isActive ? 1 : 0.5 }}
              >
                <td style={tdStyle}>{s.studentId}</td>
                <td style={tdStyle}>{s.name ?? '-'}</td>
                <td style={tdStyle}>{s.currentYear}</td>
                <td style={tdStyle}>{s.currentClass}</td>
                <td style={tdStyle}>{s.currentNumber}</td>
                <td style={tdStyle}>{s.majorSubject ?? '-'}</td>
                <td style={tdStyle}>{s.email ?? '-'}</td>
                <td style={tdStyle}>{s.phone ?? '-'}</td>
                <td style={tdStyle}>
                  <span style={{ color: s.isActive ? 'var(--reward)' : 'var(--penalty)', fontWeight: 500 }}>
                    {s.isActive ? '활성' : '비활성'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 12 }}>
        <p style={{ fontSize: 12, color: 'var(--fg-muted)' }}>
          총 {total}명 · {page} / {totalPages} 페이지
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="outline" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page <= 1 || isLoading}>
            이전
          </Button>
          <Button variant="outline" onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))} disabled={page >= totalPages || isLoading}>
            다음
          </Button>
        </div>
      </div>

      {selectedStudent && (
        <StudentDetailModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onUpdated={fetchStudents}
        />
      )}

      {showCreateModal && (
        <StudentCreateModal
          onClose={() => setShowCreateModal(false)}
          onCreated={fetchStudents}
        />
      )}

      {showBulkModal && (
        <BulkCreateModal
          onClose={() => setShowBulkModal(false)}
          onCreated={fetchStudents}
        />
      )}
    </div>
  )
}

const tdStyle: React.CSSProperties = { padding: '10px 12px', color: 'var(--fg)', whiteSpace: 'nowrap' }
const selectStyle: React.CSSProperties = { height: 36, padding: '0 8px', fontSize: 13, color: 'var(--fg)', backgroundColor: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, outline: 'none' }
const inputStyle: React.CSSProperties = { height: 36, padding: '0 10px', fontSize: 13, color: 'var(--fg)', backgroundColor: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, outline: 'none' }

function StudentDetailModal({ student, onClose, onUpdated }: {
  student: Student
  onClose: () => void
  onUpdated: () => void | Promise<void>
}) {
  const [fields, setFields] = useState({ name: student.name ?? '', phone: student.phone ?? '', email: student.email ?? '', majorSubject: student.majorSubject ?? '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/teacher/students/${encodeURIComponent(student.studentId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      })
      const payload = await res.json().catch(() => null)
      if (!res.ok) { setError(payload?.message ?? '저장 실패'); return }
      await onUpdated()
      onClose()
    } catch { setError('저장 중 오류가 발생했습니다.') }
    finally { setSaving(false) }
  }

  async function handleResetPassword() {
    if (!confirm(`${student.studentId}의 비밀번호를 학번으로 초기화하시겠습니까?`)) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/teacher/students/${encodeURIComponent(student.studentId)}/reset-password`, { method: 'POST' })
      const payload = await res.json().catch(() => null)
      if (!res.ok) {
        setError(payload?.message ?? '비밀번호 초기화에 실패했습니다.')
        return
      }
      alert(`비밀번호가 ${student.studentId}(으)로 초기화되었습니다.`)
      await onUpdated()
      onClose()
    } catch {
      setError('비밀번호 초기화 중 오류가 발생했습니다.')
    } finally { setSaving(false) }
  }

  async function handleToggleActive() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/teacher/students/${encodeURIComponent(student.studentId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !student.isActive }),
      })
      const payload = await res.json().catch(() => null)
      if (!res.ok) {
        setError(payload?.message ?? '상태 변경에 실패했습니다.')
        return
      }
      await onUpdated()
      onClose()
    } catch {
      setError('상태 변경 중 오류가 발생했습니다.')
    } finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!confirm(`정말 ${student.studentId} 학생을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return
    setSaving(true)
    setError('')
    try {
      const res = await fetch(`/api/teacher/students/${encodeURIComponent(student.studentId)}`, { method: 'DELETE' })
      const payload = await res.json().catch(() => null)
      if (!res.ok) {
        setError(payload?.message ?? '삭제에 실패했습니다.')
        return
      }
      await onUpdated()
      onClose()
    } catch {
      setError('삭제 중 오류가 발생했습니다.')
    } finally { setSaving(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ backgroundColor: 'var(--bg)', borderRadius: 12, padding: 28, width: 440, maxWidth: '90vw', maxHeight: '80vh', overflowY: 'auto' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: 'var(--fg)' }}>학생 상세 — {student.studentId}</h2>

        {[
          { label: '이름', key: 'name' as const },
          { label: '이메일', key: 'email' as const },
          { label: '전화번호', key: 'phone' as const },
          { label: '과', key: 'majorSubject' as const },
        ].map(({ label, key }) => (
          <div key={key} style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, color: 'var(--fg-muted)', display: 'block', marginBottom: 4 }}>{label}</label>
            <input
              value={fields[key]}
              onChange={(e) => setFields(f => ({ ...f, [key]: e.target.value }))}
              disabled={saving}
              style={{ ...inputStyle, width: '100%' }}
            />
          </div>
        ))}

        {error && <p style={{ color: 'var(--penalty)', fontSize: 13, marginBottom: 12 }}>{error}</p>}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 20 }}>
          <Button onClick={handleSave} loading={saving} fullWidth>저장</Button>
          <Button variant="outline" onClick={handleResetPassword} disabled={saving} fullWidth>비밀번호 초기화 (→ 학번)</Button>
          <Button variant="outline" onClick={handleToggleActive} disabled={saving} fullWidth>
            {student.isActive ? '계정 비활성화' : '계정 활성화'}
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={saving} fullWidth>계정 삭제</Button>
          <Button variant="ghost" onClick={onClose} disabled={saving} fullWidth>닫기</Button>
        </div>
      </div>
    </div>
  )
}

function StudentCreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void | Promise<void> }) {
  const [form, setForm] = useState({ school: 'GBSW', year: '1', class: '', number: '', majorSubject: '' })
  const [result, setResult] = useState<{ studentId: string; temporaryPassword: string } | null>(null)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/teacher/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ school: form.school, year: Number(form.year), class: Number(form.class), number: Number(form.number), majorSubject: form.majorSubject || undefined }),
      })
      const payload = await res.json().catch(() => null)
      if (!res.ok) { setError(payload?.message ?? '생성 실패'); return }
      setResult({ studentId: payload.studentId, temporaryPassword: payload.temporaryPassword })
      await onCreated()
    } catch { setError('생성 중 오류가 발생했습니다.') }
    finally { setIsSubmitting(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ backgroundColor: 'var(--bg)', borderRadius: 12, padding: 28, width: 400, maxWidth: '90vw' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: 'var(--fg)' }}>학생 단건 생성</h2>
        {result ? (
          <div>
            <p style={{ marginBottom: 12 }}>생성 완료: <strong>{result.studentId}</strong></p>
            <p style={{ marginBottom: 20 }}>임시 비밀번호: <strong>{result.temporaryPassword}</strong></p>
            <Button onClick={onClose} fullWidth>닫기</Button>
          </div>
        ) : (
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <select value={form.school} onChange={(e) => setForm(f => ({ ...f, school: e.target.value }))} style={selectStyle}>
              <option value="GBSW">GBSW</option>
              <option value="BYMS">BYMS</option>
            </select>
            <select value={form.year} onChange={(e) => setForm(f => ({ ...f, year: e.target.value }))} style={selectStyle}>
              {['1', '2', '3'].map(y => <option key={y} value={y}>{y}학년</option>)}
            </select>
            <input type="number" placeholder="반" value={form.class} onChange={(e) => setForm(f => ({ ...f, class: e.target.value }))} style={inputStyle} min={1} max={99} required />
            <input type="number" placeholder="번호" value={form.number} onChange={(e) => setForm(f => ({ ...f, number: e.target.value }))} style={inputStyle} min={1} max={99} required />
            <input type="text" placeholder="과 (선택)" value={form.majorSubject} onChange={(e) => setForm(f => ({ ...f, majorSubject: e.target.value }))} style={inputStyle} />
            {error && <p style={{ color: 'var(--penalty)', fontSize: 13 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <Button type="submit" loading={isSubmitting} fullWidth>생성</Button>
              <Button type="button" variant="outline" onClick={onClose} fullWidth>취소</Button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

type BulkPreviewRow = { studentId: string; currentYear: number; currentClass: number; currentNumber: number; majorSubject: string | null; temporaryPassword: string }

function BulkCreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void | Promise<void> }) {
  const [form, setForm] = useState({ school: 'GBSW', year: '1', class: '', majorSubject: '', startNumber: '', endNumber: '' })
  const [preview, setPreview] = useState<BulkPreviewRow[] | null>(null)
  const [skipped, setSkipped] = useState<{ studentId: string }[]>([])
  const [done, setDone] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  function buildPreview() {
    const year = parseInt(form.year)
    const classNum = parseInt(form.class)
    const start = parseInt(form.startNumber)
    const end = parseInt(form.endNumber)
    if (!classNum || !start || !end || start > end) return

    const calendarYear2 = new Date().getFullYear().toString().slice(-2)
    const prefix = form.school === 'GBSW' ? 'GB' : 'BY'
    const rows: BulkPreviewRow[] = []
    for (let n = start; n <= end; n++) {
      const studentId = `${prefix}${calendarYear2}${String(classNum).padStart(2,'0')}${String(n).padStart(2,'0')}`
      rows.push({ studentId, currentYear: year, currentClass: classNum, currentNumber: n, majorSubject: form.majorSubject || null, temporaryPassword: studentId })
    }
    setPreview(rows)
  }

  async function handleConfirm() {
    setIsSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/teacher/students/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school: form.school, year: Number(form.year),
          class: Number(form.class), majorSubject: form.majorSubject || undefined,
          startNumber: Number(form.startNumber), endNumber: Number(form.endNumber),
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) { setError(data?.message ?? '일괄 생성 실패'); return }
      setSkipped(data.skipped ?? [])
      const header = '학번,학년,반,번호,과,임시비밀번호'
      const rows = (data.created as BulkPreviewRow[]).map(r =>
        [r.studentId, r.currentYear, r.currentClass, r.currentNumber, r.majorSubject ?? '', r.temporaryPassword].join(',')
      )
      const txt = [header, ...rows].join('\n')
      const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const today = new Date().toISOString().slice(0,10).replace(/-/g,'')
      a.href = url
      a.download = `students_${form.year}학년_${form.class}반_${today}.txt`
      a.click()
      URL.revokeObjectURL(url)
      setDone(true)
      await onCreated()
    } catch {
      setError('일괄 생성 요청 중 오류가 발생했습니다.')
    } finally { setIsSubmitting(false) }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ backgroundColor: 'var(--bg)', borderRadius: 12, padding: 28, width: 560, maxWidth: '95vw', maxHeight: '85vh', overflowY: 'auto' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: 'var(--fg)' }}>일괄 생성</h2>
        {done ? (
          <div>
            <p style={{ marginBottom: 8 }}>생성 완료. txt 파일이 다운로드되었습니다.</p>
            {skipped.length > 0 && <p style={{ color: 'var(--penalty)', fontSize: 13, marginBottom: 12 }}>건너뜀: {skipped.map(s => s.studentId).join(', ')}</p>}
            <Button onClick={onClose} fullWidth>닫기</Button>
          </div>
        ) : preview ? (
          <div>
            <div style={{ overflowX: 'auto', maxHeight: 300, marginBottom: 16 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['학번', '학년', '반', '번호', '과', '임시비밀번호'].map(h => (
                    <th key={h} style={{ padding: '6px 8px', textAlign: 'left', color: 'var(--fg-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>{preview.map(r => (
                  <tr key={r.studentId} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '6px 8px' }}>{r.studentId}</td>
                    <td style={{ padding: '6px 8px' }}>{r.currentYear}</td>
                    <td style={{ padding: '6px 8px' }}>{r.currentClass}</td>
                    <td style={{ padding: '6px 8px' }}>{r.currentNumber}</td>
                    <td style={{ padding: '6px 8px' }}>{r.majorSubject ?? ''}</td>
                    <td style={{ padding: '6px 8px' }}>{r.temporaryPassword}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            {error && <p style={{ color: 'var(--penalty)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <Button onClick={handleConfirm} loading={isSubmitting} fullWidth>생성 확인</Button>
              <Button variant="outline" onClick={() => setPreview(null)} fullWidth>뒤로</Button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <select value={form.school} onChange={(e) => setForm(f => ({ ...f, school: e.target.value }))} style={selectStyle}>
              <option value="GBSW">GBSW</option>
              <option value="BYMS">BYMS</option>
            </select>
            <select value={form.year} onChange={(e) => setForm(f => ({ ...f, year: e.target.value }))} style={selectStyle}>
              {['1','2','3'].map(y => <option key={y} value={y}>{y}학년</option>)}
            </select>
            <input type="number" placeholder="반" value={form.class} onChange={(e) => setForm(f => ({ ...f, class: e.target.value }))} style={inputStyle} min={1} max={99} />
            <input type="text" placeholder="과 (선택)" value={form.majorSubject} onChange={(e) => setForm(f => ({ ...f, majorSubject: e.target.value }))} style={inputStyle} />
            <input type="number" placeholder="시작 번호" value={form.startNumber} onChange={(e) => setForm(f => ({ ...f, startNumber: e.target.value }))} style={inputStyle} min={1} max={99} />
            <input type="number" placeholder="끝 번호" value={form.endNumber} onChange={(e) => setForm(f => ({ ...f, endNumber: e.target.value }))} style={inputStyle} min={1} max={99} />
            <div style={{ display: 'flex', gap: 8 }}>
              <Button onClick={buildPreview} fullWidth>미리보기</Button>
              <Button variant="outline" onClick={onClose} fullWidth>취소</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
