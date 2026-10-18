import { useEffect, useId, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import {
  getPronunciationNotes,
  PRONUNCIATION_CAVEAT,
} from '../data/pronunciationGuide'

interface PronunciationPopoverProps {
  pronunciation: string
}

// A small contextual "speech bubble" that explains only the special
// Finnish-oriented pronunciation notation actually used in the CURRENT
// sentence, followed by the source's caveat that the notation is only
// approximate (see src/data/pronunciationGuide.ts for the approved source
// and detection rules). Works as a disclosure: the panel opens inline in the
// page flow below the button and pushes the content below it down, so it
// never covers the audio or Previous/Next controls - never a separate
// page/route. It is closed with its own button, the trigger or Escape
// (not by clicking elsewhere, which would shift the layout mid-click).
function PronunciationPopover({ pronunciation }: PronunciationPopoverProps) {
  const [open, setOpen] = useState(false)
  const popoverId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  const notes = getPronunciationNotes(pronunciation)

  useEffect(() => {
    if (open) closeRef.current?.focus()
  }, [open])

  function close() {
    setOpen(false)
    triggerRef.current?.focus()
  }

  // Escape only applies while focus is inside this component, so it never
  // pulls focus back here from elsewhere on the page.
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (open && event.key === 'Escape') {
      event.preventDefault()
      close()
    }
  }

  // Sentence changes (Previous/Next) should always close a stale popover
  // rather than leave outdated notes open for the new sentence.
  useEffect(() => {
    setOpen(false)
  }, [pronunciation])

  return (
    <div className="relative w-full max-w-xs" onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        type="button"
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
          role="region"
          aria-label="Ääntämysohje"
          className="relative mt-3 w-full rounded-2xl border border-white/70 bg-white p-4 text-left text-sm text-slate-700 shadow-2xl shadow-indigo-950/15"
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
              onClick={close}
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

          <p className="relative mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
            {PRONUNCIATION_CAVEAT}
          </p>
        </div>
      )}
    </div>
  )
}

export default PronunciationPopover
