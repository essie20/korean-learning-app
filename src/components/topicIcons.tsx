import type { ReactNode } from 'react'

// One small decorative line-icon per topic (by order, 1-10). Purely visual -
// the topic identity itself still comes from the title/data, not the icon.
const paths: ReactNode[] = [
  <path key="1" d="M8 12h8M12 8v8M4 12a8 8 0 1 0 16 0 8 8 0 0 0-16 0Z" />, // Tervehdykset: greeting/wave-ish burst
  <path
    key="2"
    d="M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8ZM4 20c0-4.4 3.6-7 8-7s8 2.6 8 7"
  />, // Esittäytyminen: person
  <path
    key="3"
    d="M4 9h12v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V9ZM16 10h2a2 2 0 0 1 0 4h-2M7 4v2M11 4v2"
  />, // Kahvilassa: cup
  <path
    key="4"
    d="M6 4v7a2 2 0 0 0 4 0V4M8 11v9M17 4c-2 0-3 2-3 5s1 5 3 5V4Z"
  />, // Ravintolassa: fork+knife
  <path key="5" d="M6 8h12l-1 12H7L6 8ZM9 8V6a3 3 0 0 1 6 0v2" />, // Ostoksilla: bag
  <path
    key="6"
    d="M12 21s7-7.2 7-12a7 7 0 1 0-14 0c0 4.8 7 12 7 12ZM12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
  />, // Tien kysyminen: map pin
  <path
    key="7"
    d="M4 16V7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9M4 16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2M8 20l1-2M16 20l-1-2M6 12h12"
  />, // Julkinen liikenne: bus
  <path
    key="8"
    d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z"
  />, // Arjessa: sun
  <path key="9" d="M12 7v5l3 3M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />, // Aika ja tapaamiset: clock
  <path key="10" d="M12 18h.01M9.5 9a2.5 2.5 0 0 1 5 0c0 1.7-2.5 2-2.5 4" />, // Apu ja ymmärtäminen: question mark
]

interface TopicIconProps {
  order: number
  className?: string
}

function TopicIcon({ order, className = 'h-5 w-5' }: TopicIconProps) {
  const path = paths[order - 1] ?? paths[0]
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {path}
    </svg>
  )
}

export default TopicIcon
