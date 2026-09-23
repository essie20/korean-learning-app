// Simple inline icons for the audio button: a speaker (play) and a pause
// symbol (playing). Both are decorative only - the button's own text is
// what screen readers announce, not these icons.
interface IconProps {
  className?: string
}

export function SpeakerIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`shrink-0 ${className}`}
    >
      <polygon points="3 9 8 9 13 4 13 20 8 15 3 15 3 9" />
      <path d="M16 8.5a4.5 4.5 0 0 1 0 7" />
      <path d="M18.5 6a8 8 0 0 1 0 12" />
    </svg>
  )
}

export function PauseIcon({ className = 'h-5 w-5' }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={`shrink-0 ${className}`}
    >
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  )
}
