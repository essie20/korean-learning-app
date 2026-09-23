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
      className="m-auto w-[calc(100%-1rem)] max-w-md rounded-[2rem] border border-white/60 bg-white/95 p-4 text-slate-900 shadow-2xl shadow-indigo-950/10 backdrop-blur backdrop:bg-slate-900/50 sm:p-8"
    >
      <h2 id={titleId} className="text-xl font-bold">
        {title}
      </h2>
      <p id={messageId} className="mt-3 text-lg text-slate-700">
        {message}
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        {/* full width on small screens so large text has room to wrap */}
        <button
          type="button"
          className={`${secondaryButton} w-full sm:w-auto`}
          onClick={onCancel}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          className={`${dangerButton} w-full sm:w-auto`}
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </dialog>
  )
}

export default ConfirmDialog
