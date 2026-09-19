import { useEffect, useId, useRef } from 'react'
import { dangerButton, secondaryButton } from './buttonStyles'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  cancelLabel: string
  confirmLabel: string
  onCancel: () => void
  onConfirm: () => void
}

// Uses the native <dialog> element. showModal() makes the rest of the page
// inert, keeps keyboard focus inside the dialog and returns focus to the
// button that opened it when the dialog closes.
function ConfirmDialog({
  open,
  title,
  message,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const messageId = useId()

  // The "open" prop decides whether the dialog is shown
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) {
      dialog.showModal()
    } else if (!open && dialog.open) {
      dialog.close()
    }
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={messageId}
      // Escape fires "cancel": keep control in React state instead of letting
      // the browser close the dialog by itself
      onCancel={(event) => {
        event.preventDefault()
        onCancel()
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-slate-300 bg-white p-6 text-slate-900 backdrop:bg-black/50"
    >
      <h2 id={titleId} className="text-xl font-bold">
        {title}
      </h2>
      <p id={messageId} className="mt-3 text-lg text-slate-700">
        {message}
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" className={secondaryButton} onClick={onCancel}>
          {cancelLabel}
        </button>
        <button type="button" className={dangerButton} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </dialog>
  )
}

export default ConfirmDialog
