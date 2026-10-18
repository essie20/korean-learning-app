import { useEffect, useId, useRef, useState } from 'react'
import { getPronunciationNotes } from '../data/pronunciationGuide'

interface PronunciationPopoverProps {
  pronunciation: string
}

// A small contextual "speech bubble" that explains only the special
// Finnish-oriented pronunciation notation actually used in the CURRENT
// sentence (see src/data/pronunciationGuide.ts for the approved source and
// detection rules). Opens and closes in place next to the pronunciation
// text - never a separate page/route.
function PronunciationPopover({ pronunciation }: PronunciationPopoverProps) {
  const [open, setOpen] = useState(false)
  const popoverId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const notes = getPronunciationNotes(pronunciation)

  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    function handlePointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('mousedown', handlePointerDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('mousedown', handlePointerDown)
    }
  }, [open])

  // Sentence changes (Previous/Next) should always close a stale popover
  // rather than leave outdated notes open for the new sentence.
  useEffect(() => {
    setOpen(false)
  }, [pronunciation])

  return (
    <div ref={containerRef} className="relative w-full max-w-xs">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={popoverId}
        aria-label="Näytä ääntämysohje tälle lauseelle"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-100 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4 shrink-0"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M9.5 9.3a2.5 2.5 0 1 1 3.3 2.4c-.7.3-.8.8-.8 1.4" />
          <path d="M12 16.8v.1" />
        </svg>
        Ääntämysohje
      </button>

      {open && (
        <div
          id={popoverId}
          role="dialog"
          aria-label="Ääntämysohje"
          className="absolute top-full left-0 z-20 mt-3 w-full rounded-2xl border border-white/70 bg-white p-4 text-left text-sm text-slate-700 shadow-2xl shadow-indigo-950/15"
        >
          {/* speech-bubble tail */}
          <span
            aria-hidden="true"
            className="absolute -top-2 left-6 h-4 w-4 rotate-45 border-t border-l border-white/70 bg-white"
          />

          <div className="relative flex items-start justify-between gap-3">
            <h2 className="font-bold text-slate-900">Ääntämysohje</h2>
            <button
              ref={closeRef}
              type="button"
              aria-label="Sulje ääntämysohje"
              onClick={() => {
                setOpen(false)
                triggerRef.current?.focus()
              }}
              className="-mt-1 -mr-1 shrink-0 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>

          {notes.length > 0 ? (
            <dl className="relative mt-3 flex flex-col gap-3">
              {notes.map((note) => (
                <div key={note.id}>
                  <dt className="font-mono font-semibold text-indigo-700">
                    {note.label}
                  </dt>
                  <dd className="mt-0.5">{note.text}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="relative mt-3">
              Tälle lauseelle ei ole erillisiä ääntämyshuomioita.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default PronunciationPopover
