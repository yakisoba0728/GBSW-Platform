'use client'

import { useEffect, useRef, useState, type MutableRefObject } from 'react'
import { Button } from '@/app/components/ui/button'
import AdminDbActionDialog from './AdminDbActionDialog'
import {
  ADMIN_DB_PAGE_SIZE,
  ADMIN_DB_REQUEST_TIMEOUT_MS,
  extractAdminDbMessage,
  getAdminDbQuerySummary,
  getAdminDbTotalPages,
  shouldConfirmAdminDbSql,
} from './admin-db-utils'

type ColumnMeta = { name: string; type: string; nullable: boolean }
type QueryResult = { columns?: string[]; rows?: unknown[][]; rowsAffected?: number; error?: string }
type TableListPayload = { tables?: unknown }
type TableDataPayload = {
  columns?: unknown
  pkColumn?: unknown
  rows?: unknown
  total?: unknown
}
type PendingAction = {
  title: string
  description: string
  confirmLabel: string
  details?: string[]
  onConfirm: () => Promise<void>
}

export default function AdminDbClient() {
  const [tables, setTables] = useState<string[]>([])
  const [tableListRefreshKey, setTableListRefreshKey] = useState(0)
  const [selectedTable, setSelectedTable] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'table' | 'sql'>('table')
  const [columns, setColumns] = useState<ColumnMeta[]>([])
  const [pkColumn, setPkColumn] = useState('id')
  const [rows, setRows] = useState<unknown[][]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [sql, setSql] = useState('SELECT * FROM students LIMIT 10;')
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null)
  const [tableListLoading, setTableListLoading] = useState(false)
  const [tableLoading, setTableLoading] = useState(false)
  const [queryLoading, setQueryLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [tableListError, setTableListError] = useState<string | null>(null)
  const [tableError, setTableError] = useState<string | null>(null)
  const [queryError, setQueryError] = useState<string | null>(null)
  const [editingCell, setEditingCell] = useState<{ rowIdx: number; colIdx: number } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [reauthPassword, setReauthPassword] = useState('')
  const [auditReason, setAuditReason] = useState('')

  const tableListRequestRef = useRef<AbortController | null>(null)
  const tableDataRequestRef = useRef<AbortController | null>(null)
  const queryRequestRef = useRef<AbortController | null>(null)
  const actionRequestRef = useRef<AbortController | null>(null)

  const isProduction = process.env.NODE_ENV === 'production'

  useEffect(() => {
    let mounted = true
    const request = beginTimedRequest(tableListRequestRef)

    async function loadTables() {
      setTableListLoading(true)
      setTableListError(null)

      try {
        const response = await fetch('/api/admin/db/tables', {
          cache: 'no-store',
          signal: request.controller.signal,
        })
        const payload = (await readJsonPayload(response)) as TableListPayload | null

        if (!response.ok) {
          throw new Error(extractAdminDbMessage(payload, '테이블 목록을 불러오지 못했습니다.'))
        }

        const nextTables = Array.isArray(payload?.tables)
          ? payload.tables.filter((table: unknown): table is string => typeof table === 'string' && table.trim().length > 0)
          : []

        if (mounted) {
          setTables(nextTables)
        }
      } catch (error) {
        if (!mounted || tableListRequestRef.current !== request.controller) {
          return
        }

        setTableListError(getRequestErrorMessage(error, '테이블 목록을 불러오지 못했습니다.'))
      } finally {
        if (mounted && tableListRequestRef.current === request.controller) {
          setTableListLoading(false)
        }
        request.cleanup()
      }
    }

    void loadTables()

    return () => {
      mounted = false
      request.controller.abort()
      request.cleanup()
    }
  }, [tableListRefreshKey])

  useEffect(() => {
    if (!selectedTable) {
      setColumns([])
      setRows([])
      setTotal(0)
      setPkColumn('id')
      setTableError(null)
      setEditingCell(null)
      return
    }

    let mounted = true
    const tableName = selectedTable
    const request = beginTimedRequest(tableDataRequestRef)

    async function loadTableData() {
      setTableLoading(true)
      setTableError(null)
      setEditingCell(null)

      try {
        const response = await fetch(
          `/api/admin/db/tables/${encodeURIComponent(tableName)}?page=${page}&limit=${ADMIN_DB_PAGE_SIZE}`,
          {
            cache: 'no-store',
            signal: request.controller.signal,
          },
        )
        const payload = (await readJsonPayload(response)) as TableDataPayload | null

        if (!response.ok) {
          throw new Error(extractAdminDbMessage(payload, '테이블 데이터를 불러오지 못했습니다.'))
        }

        if (mounted) {
          setColumns(Array.isArray(payload?.columns) ? payload.columns : [])
          setPkColumn(typeof payload?.pkColumn === 'string' && payload.pkColumn.trim().length > 0 ? payload.pkColumn : 'id')
          setRows(Array.isArray(payload?.rows) ? payload.rows : [])
          setTotal(typeof payload?.total === 'number' ? payload.total : 0)
        }
      } catch (error) {
        if (!mounted || tableDataRequestRef.current !== request.controller) {
          return
        }

        setTableError(getRequestErrorMessage(error, '테이블 데이터를 불러오지 못했습니다.'))
      } finally {
        if (mounted && tableDataRequestRef.current === request.controller) {
          setTableLoading(false)
        }
        request.cleanup()
      }
    }

    void loadTableData()

    return () => {
      mounted = false
      request.controller.abort()
      request.cleanup()
    }
  }, [page, selectedTable])

  useEffect(
    () => () => {
      tableListRequestRef.current?.abort()
      tableDataRequestRef.current?.abort()
      queryRequestRef.current?.abort()
      actionRequestRef.current?.abort()
    },
    [],
  )

  function buildSensitiveActionPayload(payload: Record<string, unknown>) {
    const trimmedPassword = reauthPassword.trim()
    const trimmedReason = auditReason.trim()

    if (!trimmedPassword) {
      throw new Error('DB 콘솔 민감 작업 전용 비밀번호 확인이 필요합니다.')
    }

    if (trimmedReason.length < 4) {
      throw new Error('DB 콘솔 민감 작업 사유를 4자 이상 입력해주세요.')
    }

    return {
      ...payload,
      reauthPassword: trimmedPassword,
      auditReason: trimmedReason,
    }
  }

  async function handleRunQuery() {
    const trimmedSql = sql.trim()

    if (!trimmedSql) {
      setQueryError('실행할 SQL을 입력하세요.')
      setQueryResult(null)
      return
    }

    const executeQuery = async () => {
      const request = beginTimedRequest(queryRequestRef)
      setQueryLoading(true)
      setQueryError(null)
      setQueryResult(null)

      try {
        const response = await fetch('/api/admin/db/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildSensitiveActionPayload({ sql: trimmedSql })),
          cache: 'no-store',
          signal: request.controller.signal,
        })
        const payload = await readJsonPayload(response)

        if (!response.ok) {
          throw new Error(extractAdminDbMessage(payload, 'SQL 실행에 실패했습니다.'))
        }

        if (!payload || typeof payload !== 'object') {
          setQueryResult({ error: 'SQL 실행 결과를 해석하지 못했습니다.' })
          return
        }

        const result = payload as QueryResult
        setQueryResult({
          columns: Array.isArray(result.columns) ? result.columns.filter((value): value is string => typeof value === 'string') : undefined,
          rows: Array.isArray(result.rows) ? result.rows : undefined,
          rowsAffected: typeof result.rowsAffected === 'number' ? result.rowsAffected : undefined,
        })
      } catch (error) {
        if (queryRequestRef.current !== request.controller) {
          return
        }

        setQueryError(getRequestErrorMessage(error, 'SQL 실행에 실패했습니다.'))
      } finally {
        if (queryRequestRef.current === request.controller) {
          setQueryLoading(false)
        }
        request.cleanup()
      }
    }

    if (shouldConfirmAdminDbSql(trimmedSql)) {
      setPendingAction({
        title: 'SQL 실행 확인',
        description: '선택한 쿼리는 조회 전용이 아니라 데이터 변경 가능성이 있습니다. 실행 전에 범위를 다시 확인하세요.',
        confirmLabel: '실행하기',
        details: [getAdminDbQuerySummary(trimmedSql)],
        onConfirm: executeQuery,
      })
      return
    }

    await executeQuery()
  }

  async function handleCellSave(rowIdx: number, colIdx: number) {
    if (!selectedTable) {
      return
    }

    if (actionRequestRef.current) {
      return
    }

    const pkColIdx = columns.findIndex(column => column.name === pkColumn)
    if (pkColIdx < 0) {
      setTableError('기본 키 열을 찾지 못했습니다.')
      return
    }

    const row = rows[rowIdx]
    const rowId = String(row?.[pkColIdx] ?? '')
    const column = columns[colIdx]
    const nextValue = editValue.trim()
    const previousValue = String(row?.[colIdx] ?? '')

    if (!column || rowId.length === 0) {
      setTableError('행 정보를 확인하지 못했습니다.')
      return
    }

    if (nextValue === previousValue) {
      setEditingCell(null)
      return
    }

    const request = beginTimedRequest(actionRequestRef)
    setActionLoading(true)
    setTableError(null)

    try {
      const response = await fetch(
        `/api/admin/db/tables/${encodeURIComponent(selectedTable)}/${encodeURIComponent(rowId)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            buildSensitiveActionPayload({
              column: column.name,
              value: nextValue,
            }),
          ),
          cache: 'no-store',
          signal: request.controller.signal,
        },
      )
      const payload = (await readJsonPayload(response)) as TableDataPayload | null

      if (!response.ok) {
        throw new Error(extractAdminDbMessage(payload, '셀 저장에 실패했습니다.'))
      }

      setEditingCell(null)
      await refreshTableData()
    } catch (error) {
      if (actionRequestRef.current !== request.controller) {
        return
      }

      setTableError(getRequestErrorMessage(error, '셀 저장에 실패했습니다.'))
    } finally {
      if (actionRequestRef.current === request.controller) {
        setActionLoading(false)
      }
      request.cleanup()
    }
  }

  async function handleDeleteRow(rowIdx: number) {
    if (!selectedTable) {
      return
    }

    if (actionRequestRef.current) {
      return
    }

    const pkColIdx = columns.findIndex(column => column.name === pkColumn)
    if (pkColIdx < 0) {
      setTableError('기본 키 열을 찾지 못했습니다.')
      return
    }

    const row = rows[rowIdx]
    const rowId = String(row?.[pkColIdx] ?? '')

    if (rowId.length === 0) {
      setTableError('삭제할 행 정보를 확인하지 못했습니다.')
      return
    }

    setPendingAction({
      title: '행 삭제 확인',
      description: '이 작업은 되돌리기 어렵습니다. 테이블과 행 식별자를 다시 확인한 뒤 진행하세요.',
      confirmLabel: '삭제하기',
      details: [`테이블: ${selectedTable}`, `행 ID: ${rowId}`],
      onConfirm: async () => {
        const request = beginTimedRequest(actionRequestRef)
        setActionLoading(true)
        setTableError(null)

        try {
          const response = await fetch(
            `/api/admin/db/tables/${encodeURIComponent(selectedTable)}/${encodeURIComponent(rowId)}`,
            {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(
                buildSensitiveActionPayload({
                  tableName: selectedTable,
                  rowId,
                }),
              ),
              cache: 'no-store',
              signal: request.controller.signal,
            },
          )
          const payload = await readJsonPayload(response)

          if (!response.ok) {
            throw new Error(extractAdminDbMessage(payload, '행 삭제에 실패했습니다.'))
          }

          setEditingCell(null)
          await refreshTableData()
        } catch (error) {
          if (actionRequestRef.current !== request.controller) {
            return
          }

          setTableError(getRequestErrorMessage(error, '행 삭제에 실패했습니다.'))
        } finally {
          if (actionRequestRef.current === request.controller) {
            setActionLoading(false)
          }
          request.cleanup()
        }
      },
    })
  }

  async function refreshTableData() {
    if (!selectedTable) {
      return
    }

    const tableName = selectedTable
    const request = beginTimedRequest(tableDataRequestRef)
    setTableLoading(true)
    setTableError(null)

    try {
      const response = await fetch(
        `/api/admin/db/tables/${encodeURIComponent(tableName)}?page=${page}&limit=${ADMIN_DB_PAGE_SIZE}`,
        {
          cache: 'no-store',
          signal: request.controller.signal,
        },
      )
      const payload = (await readJsonPayload(response)) as TableDataPayload | null

      if (!response.ok) {
        throw new Error(extractAdminDbMessage(payload, '테이블 데이터를 불러오지 못했습니다.'))
      }

      setColumns(Array.isArray(payload?.columns) ? payload.columns : [])
      setPkColumn(typeof payload?.pkColumn === 'string' && payload.pkColumn.trim().length > 0 ? payload.pkColumn : 'id')
      setRows(Array.isArray(payload?.rows) ? payload.rows : [])
      setTotal(typeof payload?.total === 'number' ? payload.total : 0)
    } catch (error) {
      if (tableDataRequestRef.current !== request.controller) {
        return
      }

      setTableError(getRequestErrorMessage(error, '테이블 데이터를 불러오지 못했습니다.'))
    } finally {
      if (tableDataRequestRef.current === request.controller) {
        setTableLoading(false)
      }
      request.cleanup()
    }
  }

  function selectTable(nextTable: string) {
    setSelectedTable(nextTable)
    setActiveTab('table')
    setPage(1)
    setQueryError(null)
    setQueryResult(null)
    setTableError(null)
  }

  const totalPages = getAdminDbTotalPages(total, ADMIN_DB_PAGE_SIZE)

  return (
    <div className="admin-db-root">
      <div className="admin-db-desktop-shell">
        <div className="admin-db-sidebar">
          <div className={`admin-db-banner admin-db-banner--${isProduction ? 'warning' : 'neutral'}`}>
            <strong>{isProduction ? '운영 모드' : '관리자 DB 콘솔'}</strong>
            <span>
              {isProduction
                ? '운영 환경입니다. 작은 실수도 실제 데이터 변경으로 이어질 수 있습니다.'
                : '개발 환경입니다. 운영과 동일한 위험 기준으로 조작하세요.'}
            </span>
          </div>

          <div className="admin-db-sidebar__section">
              <div className="admin-db-sidebar__title">테이블</div>
            {tableListLoading ? (
              <div className="admin-db-empty-state">테이블 목록을 불러오는 중...</div>
              ) : tableListError ? (
                <div className="admin-db-empty-state admin-db-empty-state--error">
                  <p>{tableListError}</p>
                  <button type="button" className="admin-db-link-button" onClick={() => setTableListRefreshKey(prev => prev + 1)}>
                    다시 시도
                  </button>
                </div>
            ) : tables.length === 0 ? (
              <div className="admin-db-empty-state">표시할 테이블이 없습니다.</div>
            ) : (
              <div className="admin-db-table-list">
                {tables.map(table => (
                  <button
                    key={table}
                    type="button"
                    onClick={() => selectTable(table)}
                    className={selectedTable === table ? 'is-active' : ''}
                  >
                    {table}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <main className="admin-db-main">
          <div className="admin-db-main__topbar">
            <div>
              <div className="admin-db-main__eyebrow">super-admin 전용</div>
              <h1 className="admin-db-main__title">운영 DB 콘솔</h1>
            </div>
            <div className="admin-db-main__meta">
              <span>실행 전 확인</span>
              <span>모든 변경/SQL 작업은 비밀번호 재확인과 사유 기록이 필요합니다</span>
            </div>
          </div>

          <div className="admin-db-step-up">
            <label className="admin-db-step-up__field">
              <span>최고관리자 비밀번호 확인</span>
              <input
                type="password"
                value={reauthPassword}
                onChange={(event) => setReauthPassword(event.target.value)}
                autoComplete="current-password"
                placeholder="민감 작업 실행 전 입력"
              />
            </label>
            <label className="admin-db-step-up__field admin-db-step-up__field--wide">
              <span>작업 사유</span>
              <input
                type="text"
                value={auditReason}
                onChange={(event) => setAuditReason(event.target.value)}
                placeholder="예: 운영 데이터 이상 확인, 잘못 입력된 행 수정"
              />
            </label>
          </div>

          {tableError ? <div className="admin-db-inline-error">{tableError}</div> : null}

          <div className="admin-db-tabs">
            <button
              type="button"
              onClick={() => setActiveTab('table')}
              className={activeTab === 'table' ? 'is-active' : ''}
            >
              테이블 뷰
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sql')}
              className={activeTab === 'sql' ? 'is-active' : ''}
            >
              SQL
            </button>
          </div>

          {activeTab === 'table' ? (
            <section className="admin-db-panel">
              {!selectedTable ? (
                <div className="admin-db-empty-state">왼쪽에서 테이블을 선택하세요.</div>
              ) : tableLoading ? (
                <div className="admin-db-empty-state">테이블 데이터를 불러오는 중...</div>
              ) : (
                <>
                  <div className="admin-db-table-wrap">
                    <table>
                      <thead>
                        <tr>
                          {columns.map(column => (
                            <th key={column.name}>
                              <span>{column.name}</span>
                              <small>
                                {column.type}
                                {column.nullable ? ' · nullable' : ''}
                              </small>
                            </th>
                          ))}
                          <th>삭제</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, rowIdx) => (
                          <tr key={`${selectedTable}-${rowIdx}`}>
                            {row.map((cell, colIdx) => (
                              <td key={`${selectedTable}-${rowIdx}-${colIdx}`}>
                                {editingCell?.rowIdx === rowIdx && editingCell?.colIdx === colIdx ? (
                                  <div className="admin-db-cell-editor">
                                    <input
                                      autoFocus
                                      value={editValue}
                                      onChange={event => setEditValue(event.target.value)}
                                      onKeyDown={event => {
                                        if (event.key === 'Enter') {
                                          event.preventDefault()
                                          void handleCellSave(rowIdx, colIdx)
                                        }
                                        if (event.key === 'Escape') {
                                          setEditingCell(null)
                                        }
                                      }}
                                      onBlur={() => void handleCellSave(rowIdx, colIdx)}
                                    />
                                    {actionLoading ? <span>저장 중...</span> : <span>Enter 저장</span>}
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    className="admin-db-cell-button"
                                    onClick={() => {
                                      setEditingCell({ rowIdx, colIdx })
                                      setEditValue(String(cell ?? ''))
                                    }}
                                  >
                                    {String(cell ?? '')}
                                  </button>
                                )}
                              </td>
                            ))}
                            <td>
                              <button
                                type="button"
                                className="admin-db-danger-link"
                                onClick={() => void handleDeleteRow(rowIdx)}
                                disabled={actionLoading}
                              >
                                삭제
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="admin-db-pagination">
                    <button
                      type="button"
                      onClick={() => setPage(prev => Math.max(1, prev - 1))}
                      disabled={page === 1 || tableLoading}
                    >
                      이전
                    </button>
                    <span>
                      {page} / {totalPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setPage(prev => prev + 1)}
                      disabled={page >= totalPages || tableLoading}
                    >
                      다음
                    </button>
                    <span>총 {total}행</span>
                  </div>
                </>
              )}
            </section>
          ) : (
            <section className="admin-db-panel">
              <div className="admin-db-editor-toolbar">
                <div className="admin-db-editor-toolbar__summary">
                  <strong>SQL 편집기</strong>
                  <span>조회 전용 쿼리는 즉시 실행되고, 변경성 쿼리는 확인 창이 뜹니다.</span>
                </div>
                <Button onClick={handleRunQuery} loading={queryLoading}>
                  실행
                </Button>
              </div>

              <div className="admin-db-sql-editor">
                <textarea
                  value={sql}
                  onChange={event => setSql(event.target.value)}
                  spellCheck={false}
                  autoCorrect="off"
                  autoCapitalize="off"
                  autoComplete="off"
                  aria-label="SQL editor"
                  placeholder="SELECT * FROM students LIMIT 10;"
                />
              </div>

              {queryError ? <div className="admin-db-inline-error">{queryError}</div> : null}

              {queryResult ? (
                <div className="admin-db-query-result">
                  {queryResult.error ? (
                    <div className="admin-db-empty-state admin-db-empty-state--error">{queryResult.error}</div>
                  ) : typeof queryResult.rowsAffected === 'number' ? (
                    <div className="admin-db-empty-state">{queryResult.rowsAffected}행 영향받음</div>
                  ) : queryResult.columns ? (
                    <div className="admin-db-table-wrap">
                      <table>
                        <thead>
                          <tr>
                            {queryResult.columns.map(column => (
                              <th key={column}>{column}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {(queryResult.rows ?? []).map((row, rowIdx) => (
                            <tr key={`query-${rowIdx}`}>
                              {(row ?? []).map((cell, cellIdx) => (
                                <td key={`query-${rowIdx}-${cellIdx}`}>{String(cell ?? '')}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </section>
          )}
        </main>
      </div>

      <div className="admin-db-mobile-blocker">
        <div className="admin-db-mobile-blocker__card">
          <div className="admin-db-banner admin-db-banner--warning">
            <strong>데스크톱 전용</strong>
            <span>이 DB 콘솔은 작은 화면에서 조작을 막습니다. 실수 위험이 큰 운영 도구이기 때문입니다.</span>
          </div>
          <h2>모바일 / 태블릿에서는 사용하지 마세요</h2>
          <p>
            테이블 편집, SQL 실행, 행 삭제 같은 민감 작업은 넓은 화면과 정확한 포인팅이 필요합니다.
            데스크톱 브라우저에서 다시 열어 주세요.
          </p>
        </div>
      </div>

      <AdminDbActionDialog
        open={pendingAction !== null}
        title={pendingAction?.title ?? ''}
        description={pendingAction?.description ?? ''}
        confirmLabel={pendingAction?.confirmLabel ?? '실행'}
        details={pendingAction?.details}
        busy={actionLoading || queryLoading}
        onCancel={() => setPendingAction(null)}
        onConfirm={async () => {
          const action = pendingAction
          setPendingAction(null)
          if (action) {
            await action.onConfirm()
          }
        }}
      />

      <style jsx>{`
        .admin-db-root {
          min-height: calc(100vh - 60px);
          background:
            radial-gradient(circle at top left, rgba(224, 191, 93, 0.18), transparent 28%),
            radial-gradient(circle at top right, rgba(96, 165, 250, 0.12), transparent 24%),
            var(--bg-primary);
          color: var(--fg);
        }

        .admin-db-desktop-shell {
          min-height: calc(100vh - 60px);
          display: grid;
          grid-template-columns: 280px minmax(0, 1fr);
        }

        .admin-db-sidebar {
          border-right: 1px solid var(--border);
          padding: 18px 16px;
          background: color-mix(in srgb, var(--bg-primary) 92%, white 8%);
        }

        .admin-db-sidebar__section + .admin-db-sidebar__section {
          margin-top: 20px;
        }

        .admin-db-sidebar__title {
          margin-bottom: 10px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--fg-muted);
        }

        .admin-db-table-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          max-height: calc(100vh - 220px);
          overflow: auto;
        }

        .admin-db-table-list button {
          border: 1px solid transparent;
          border-radius: 12px;
          padding: 10px 12px;
          text-align: left;
          background: transparent;
          color: var(--fg);
          cursor: pointer;
        }

        .admin-db-table-list button.is-active {
          background: var(--accent-subtle);
          border-color: color-mix(in srgb, var(--accent) 30%, transparent);
          color: var(--accent);
        }

        .admin-db-main {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding: 20px 24px 28px;
          min-width: 0;
        }

        .admin-db-main__topbar {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: flex-start;
        }

        .admin-db-main__eyebrow {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--fg-muted);
        }

        .admin-db-main__title {
          margin: 8px 0 0;
          font-size: 28px;
          line-height: 1.2;
        }

        .admin-db-main__meta {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          color: var(--fg-muted);
          font-size: 12px;
          text-align: right;
        }

        .admin-db-step-up {
          display: grid;
          grid-template-columns: minmax(240px, 320px) minmax(0, 1fr);
          gap: 12px;
        }

        .admin-db-step-up__field {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-size: 12px;
          color: var(--fg-muted);
        }

        .admin-db-step-up__field input {
          height: 40px;
          border-radius: 12px;
          border: 1px solid var(--border);
          background: color-mix(in srgb, var(--bg-primary) 92%, white 8%);
          color: var(--fg);
          padding: 0 12px;
        }

        .admin-db-step-up__field--wide input {
          width: 100%;
        }

        .admin-db-banner {
          display: flex;
          flex-direction: column;
          gap: 6px;
          border-radius: 16px;
          padding: 14px 16px;
          line-height: 1.6;
        }

        .admin-db-banner strong {
          font-size: 13px;
        }

        .admin-db-banner--neutral {
          background: var(--bg-secondary);
          color: var(--fg);
          border: 1px solid var(--border);
        }

        .admin-db-banner--warning {
          background: rgba(245, 158, 11, 0.16);
          border: 1px solid rgba(245, 158, 11, 0.38);
          color: color-mix(in srgb, var(--fg) 85%, #a16207 15%);
        }

        .admin-db-empty-state,
        .admin-db-inline-error {
          border-radius: 16px;
          padding: 18px 16px;
          background: var(--bg-secondary);
          color: var(--fg-muted);
          line-height: 1.7;
        }

        .admin-db-empty-state--error,
        .admin-db-inline-error {
          background: rgba(239, 68, 68, 0.12);
          color: color-mix(in srgb, var(--fg) 82%, #b91c1c 18%);
        }

        .admin-db-link-button {
          margin-top: 10px;
          border: none;
          background: none;
          color: var(--accent);
          font-weight: 600;
          cursor: pointer;
          padding: 0;
        }

        .admin-db-tabs {
          display: flex;
          gap: 8px;
          border-bottom: 1px solid var(--border);
        }

        .admin-db-tabs button {
          border: 1px solid transparent;
          border-bottom: 2px solid transparent;
          background: transparent;
          color: var(--fg-muted);
          padding: 12px 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .admin-db-tabs button.is-active {
          color: var(--accent);
          border-bottom-color: var(--accent);
        }

        .admin-db-panel {
          min-height: 0;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .admin-db-table-wrap {
          overflow: auto;
          border: 1px solid var(--border);
          border-radius: 18px;
          background: color-mix(in srgb, var(--bg-primary) 88%, white 12%);
        }

        .admin-db-table-wrap table {
          width: 100%;
          border-collapse: collapse;
          min-width: 780px;
        }

        .admin-db-table-wrap th,
        .admin-db-table-wrap td {
          padding: 12px 10px;
          border-bottom: 1px solid var(--border);
          vertical-align: top;
          text-align: left;
          font-size: 12px;
        }

        .admin-db-table-wrap th small {
          display: block;
          margin-top: 4px;
          color: var(--fg-muted);
          font-weight: 500;
          white-space: nowrap;
        }

        .admin-db-cell-button {
          width: 100%;
          border: none;
          background: transparent;
          padding: 0;
          color: var(--fg);
          text-align: left;
          cursor: pointer;
          word-break: break-word;
        }

        .admin-db-cell-editor {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .admin-db-cell-editor input {
          width: 100%;
          border-radius: 10px;
          border: 1px solid var(--accent);
          background: var(--bg-primary);
          color: var(--fg);
          padding: 8px 10px;
          font-size: 12px;
        }

        .admin-db-cell-editor span {
          color: var(--fg-muted);
          font-size: 11px;
        }

        .admin-db-danger-link {
          border: none;
          background: none;
          color: var(--penalty);
          cursor: pointer;
          padding: 0;
          font-weight: 600;
        }

        .admin-db-pagination {
          display: flex;
          align-items: center;
          gap: 12px;
          color: var(--fg-muted);
          font-size: 12px;
          flex-wrap: wrap;
        }

        .admin-db-pagination button {
          border: 1px solid var(--border);
          border-radius: 999px;
          background: var(--bg-secondary);
          padding: 8px 12px;
          color: var(--fg);
          cursor: pointer;
        }

        .admin-db-editor-toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }

        .admin-db-editor-toolbar__summary {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .admin-db-editor-toolbar__summary strong {
          font-size: 15px;
        }

        .admin-db-editor-toolbar__summary span {
          color: var(--fg-muted);
          font-size: 13px;
          line-height: 1.7;
        }

        .admin-db-sql-editor {
          overflow: hidden;
          border-radius: 18px;
          border: 1px solid var(--border);
          background: color-mix(in srgb, var(--bg-primary) 86%, white 14%);
          min-height: 260px;
        }

        .admin-db-sql-editor textarea {
          display: block;
          width: 100%;
          min-height: 260px;
          resize: vertical;
          border: none;
          outline: none;
          background: transparent;
          color: var(--fg);
          font-family: 'JetBrains Mono', 'SFMono-Regular', Consolas, 'Liberation Mono', monospace;
          font-size: 13px;
          line-height: 1.7;
          padding: 16px;
          tab-size: 2;
        }

        .admin-db-query-result {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .admin-db-mobile-blocker {
          display: none;
          align-items: center;
          justify-content: center;
          min-height: calc(100vh - 60px);
          padding: 20px;
        }

        .admin-db-mobile-blocker__card {
          width: min(100%, 520px);
          border-radius: 24px;
          padding: 24px;
          border: 1px solid var(--border);
          background: color-mix(in srgb, var(--bg-primary) 90%, white 10%);
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.18);
        }

        .admin-db-mobile-blocker__card h2 {
          margin: 18px 0 0;
          font-size: 22px;
        }

        .admin-db-mobile-blocker__card p {
          margin: 12px 0 0;
          color: var(--fg-muted);
          line-height: 1.8;
          font-size: 14px;
        }

        @media (max-width: 1023px) {
          .admin-db-desktop-shell {
            display: none;
          }

          .admin-db-mobile-blocker {
            display: flex;
          }
        }

        @media (max-width: 1280px) {
          .admin-db-desktop-shell {
            grid-template-columns: 240px minmax(0, 1fr);
          }

          .admin-db-step-up {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}

function beginTimedRequest(ref: MutableRefObject<AbortController | null>) {
  ref.current?.abort()

  const controller = new AbortController()
  ref.current = controller
  const timeoutId = window.setTimeout(() => controller.abort(), ADMIN_DB_REQUEST_TIMEOUT_MS)

  return {
    controller,
    cleanup: () => {
      window.clearTimeout(timeoutId)
      if (ref.current === controller) {
        ref.current = null
      }
    },
  }
}

async function readJsonPayload(response: Response): Promise<unknown> {
  const text = await response.text().catch(() => '')

  if (!text) {
    return null
  }

  try {
    return JSON.parse(text) as unknown
  } catch {
    return { error: text }
  }
}

function getRequestErrorMessage(error: unknown, fallback: string) {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return '요청 시간이 초과되어 중단되었습니다.'
  }

  if (error instanceof Error) {
    return extractAdminDbMessage(error.message, fallback)
  }

  return fallback
}
