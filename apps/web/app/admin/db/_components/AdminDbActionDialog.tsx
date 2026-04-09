'use client'

type AdminDbActionDialogProps = {
  open: boolean
  title: string
  description: string
  confirmLabel: string
  cancelLabel?: string
  details?: string[]
  busy?: boolean
  onCancel: () => void
  onConfirm: () => void | Promise<void>
}

export default function AdminDbActionDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = '취소',
  details = [],
  busy = false,
  onCancel,
  onConfirm,
}: AdminDbActionDialogProps) {
  if (!open) {
    return null
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-db-action-title"
      className="admin-db-action-dialog"
    >
      <div className="admin-db-action-dialog__card">
        <div className="admin-db-action-dialog__eyebrow">주의가 필요한 작업</div>
        <h2 id="admin-db-action-title" className="admin-db-action-dialog__title">
          {title}
        </h2>
        <p className="admin-db-action-dialog__description">{description}</p>
        {details.length > 0 && (
          <ul className="admin-db-action-dialog__details">
            {details.map(detail => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        )}
        <div className="admin-db-action-dialog__actions">
          <button
            type="button"
            onClick={onCancel}
            className="admin-db-action-dialog__button admin-db-action-dialog__button--secondary"
            disabled={busy}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => void onConfirm()}
            className="admin-db-action-dialog__button admin-db-action-dialog__button--danger"
            disabled={busy}
          >
            {busy ? '처리 중...' : confirmLabel}
          </button>
        </div>
      </div>

      <style jsx>{`
        .admin-db-action-dialog {
          position: fixed;
          inset: 0;
          z-index: 80;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: rgba(10, 12, 20, 0.68);
          backdrop-filter: blur(6px);
        }

        .admin-db-action-dialog__card {
          width: min(100%, 560px);
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 20px;
          background: color-mix(in srgb, var(--bg-primary) 92%, black 8%);
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.42);
          padding: 24px;
        }

        .admin-db-action-dialog__eyebrow {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--fg-muted);
        }

        .admin-db-action-dialog__title {
          margin: 10px 0 0;
          font-size: 20px;
          line-height: 1.35;
          color: var(--fg);
        }

        .admin-db-action-dialog__description {
          margin: 12px 0 0;
          color: var(--fg-muted);
          line-height: 1.7;
          font-size: 14px;
        }

        .admin-db-action-dialog__details {
          margin: 16px 0 0;
          padding: 14px 16px 14px 22px;
          border-radius: 14px;
          background: var(--bg-secondary);
          color: var(--fg-muted);
          font-size: 13px;
          line-height: 1.7;
        }

        .admin-db-action-dialog__actions {
          margin-top: 20px;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .admin-db-action-dialog__button {
          border: 1px solid transparent;
          border-radius: 12px;
          padding: 10px 16px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .admin-db-action-dialog__button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .admin-db-action-dialog__button--secondary {
          background: var(--bg-secondary);
          color: var(--fg);
          border-color: var(--border);
        }

        .admin-db-action-dialog__button--danger {
          background: var(--penalty);
          color: white;
        }
      `}</style>
    </div>
  )
}
