import { useCallback, useEffect, useId, useState } from 'react'
import './TestDataNoticeModal.css'

const STORAGE_KEY = 'causr-env-notice-dismissed'

const BODY_COPY =
  'This environment uses synthetic log streams for demonstration purposes. Metrics, alerts, and platform behavior are fully functional.'

export function TestDataNoticeModal() {
  const [open, setOpen] = useState(false)
  const titleId = useId()
  const descId = useId()

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY) !== '1') {
        setOpen(true)
      }
    } catch {
      setOpen(true)
    }
  }, [])

  const dismiss = useCallback(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* ignore */
    }
    setOpen(false)
  }, [])

  useEffect(() => {
    if (!open) {
      return
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        dismiss()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, dismiss])

  if (!open) {
    return null
  }

  return (
    <div
      className="env-notice-overlay"
      role="presentation"
      onClick={dismiss}
    >
      <div
        className="env-notice-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="material-symbols-outlined env-notice-dialog__icon" aria-hidden>
          info
        </span>
        <h2 id={titleId} className="env-notice-dialog__title">
          About this environment
        </h2>
        <p id={descId} className="env-notice-dialog__body">
          {BODY_COPY}
        </p>
        <button type="button" className="env-notice-dialog__btn" onClick={dismiss}>
          Got it
        </button>
      </div>
    </div>
  )
}
