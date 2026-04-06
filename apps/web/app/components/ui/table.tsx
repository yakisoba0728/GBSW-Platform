import type { CSSProperties, ReactNode } from 'react'

// ─── Skeleton keyframe (injected once per TableSkeleton render) ───────────────

const skeletonKeyframe = `
@keyframes skeletonShimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
`

const shimmerStyle: CSSProperties = {
  background: 'linear-gradient(90deg, var(--bg-muted) 25%, var(--bg-subtle) 50%, var(--bg-muted) 75%)',
  backgroundSize: '200% 100%',
  animation: 'skeletonShimmer 1.6s ease-in-out infinite',
}

// ─── Table ────────────────────────────────────────────────────────────────────

export function Table({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div style={{ overflowX: 'auto', width: '100%' }}>
      <table
        className={className}
        style={{
          width: '100%',
          borderCollapse: 'separate',
          borderSpacing: 0,
        }}
      >
        {children}
      </table>
    </div>
  )
}

// ─── TableHead ────────────────────────────────────────────────────────────────

export function TableHead({ children }: { children: ReactNode }) {
  return <thead>{children}</thead>
}

// ─── TableRow ─────────────────────────────────────────────────────────────────

export function TableRow({
  children,
  onClick,
  className = '',
}: {
  children: ReactNode
  onClick?: () => void
  className?: string
}) {
  const interactiveStyle: CSSProperties = onClick
    ? { cursor: 'pointer', transition: 'background-color 0.15s' }
    : {}

  return (
    <tr
      className={className}
      style={{
        borderBottom: '1px solid var(--border)',
        ...interactiveStyle,
      }}
      onClick={onClick}
      onMouseEnter={
        onClick
          ? (e) => {
              ;(e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                'var(--bg-muted)'
            }
          : undefined
      }
      onMouseLeave={
        onClick
          ? (e) => {
              ;(e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                ''
            }
          : undefined
      }
    >
      {children}
    </tr>
  )
}

// ─── TableHeader ──────────────────────────────────────────────────────────────

export function TableHeader({
  children,
  className = '',
  width,
}: {
  children: ReactNode
  className?: string
  width?: string
}) {
  return (
    <th
      className={className}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1,
        background: 'var(--bg-subtle)',
        boxShadow: 'inset 0 -1px 0 var(--border)',
        padding: '10px 12px',
        textAlign: 'left',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        color: 'var(--fg-muted)',
        width: width,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </th>
  )
}

// ─── TableBody ────────────────────────────────────────────────────────────────

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody>{children}</tbody>
}

// ─── TableCell ────────────────────────────────────────────────────────────────

export function TableCell({
  children,
  className = '',
  colSpan,
}: {
  children?: ReactNode
  className?: string
  colSpan?: number
}) {
  return (
    <td
      className={className}
      colSpan={colSpan}
      style={{
        padding: '10px 12px',
        fontSize: '14px',
        color: 'var(--fg)',
        verticalAlign: 'middle',
      }}
    >
      {children}
    </td>
  )
}

// ─── TableSkeleton ────────────────────────────────────────────────────────────

export function TableSkeleton({
  rows = 5,
  cols = 4,
  className = '',
}: {
  rows?: number
  cols?: number
  className?: string
}) {
  return (
    <div style={{ overflowX: 'auto', width: '100%' }} className={className}>
      <style>{skeletonKeyframe}</style>
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
        <thead>
          <tr>
            {Array.from({ length: cols }, (_, col) => (
              <th
                key={col}
                style={{
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                  background: 'var(--bg-subtle)',
                  boxShadow: 'inset 0 -1px 0 var(--border)',
                  padding: '10px 12px',
                }}
              >
                <div
                  style={{
                    ...shimmerStyle,
                    height: '10px',
                    width: col === 0 ? '60%' : col % 2 === 0 ? '45%' : '55%',
                    borderRadius: '4px',
                  }}
                />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }, (_, row) => (
            <tr key={row} style={{ borderBottom: '1px solid var(--border)' }}>
              {Array.from({ length: cols }, (_, col) => (
                <td key={col} style={{ padding: '10px 12px' }}>
                  <div
                    style={{
                      ...shimmerStyle,
                      height: '13px',
                      width: ['60%', '80%', '50%', '70%'][(row + col) % 4],
                      borderRadius: '4px',
                    }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── TableEmpty ───────────────────────────────────────────────────────────────

export function TableEmpty({
  message = '데이터가 없습니다',
  colSpan = 10,
}: {
  message?: string
  colSpan?: number
}) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        style={{
          textAlign: 'center',
          color: 'var(--fg-muted)',
          fontSize: '14px',
          padding: '40px 12px',
        }}
      >
        {message}
      </td>
    </tr>
  )
}
