interface ProgressRingProps {
  percent: number
  size?: number
  strokeWidth?: number
}

// A circular progress indicator (decorative). Used where overall or topic
// progress needs a stronger visual than the linear ProgressBar - the
// numeric value next to/inside it is what conveys the information.
function ProgressRing({
  percent,
  size = 120,
  strokeWidth = 10,
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, percent))
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (clamped / 100) * circumference

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
      className="-rotate-90"
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        className="stroke-slate-200"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="stroke-blue-600 transition-[stroke-dashoffset] duration-500"
      />
    </svg>
  )
}

export default ProgressRing
