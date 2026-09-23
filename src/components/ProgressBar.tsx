interface ProgressBarProps {
  percent: number
  /** Bar height/rounding, e.g. "h-1.5" (Study) or "h-3" (Home). */
  className?: string
  /** Fill colour classes; a gradient by default for a richer look. */
  fillClassName?: string
}

// A small reusable progress bar, shared across the app so progress always
// reads the same way.
function ProgressBar({
  percent,
  className = 'h-1.5',
  fillClassName = 'bg-gradient-to-r from-blue-500 to-indigo-600',
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, percent))
  return (
    <div
      className={`w-full rounded-full bg-slate-200/80 ${className}`}
      role="presentation"
    >
      <div
        className={`rounded-full transition-[width] ${fillClassName} ${className}`}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}

export default ProgressBar
