interface MascotProps {
  /** File name under public/images/mascot/ */
  src: string
  className?: string
  /** Target height in px - width follows automatically so the transparent
   * cutout's own proportions are never stretched or squashed. */
  size?: number
}

// A small decorative bunny mascot image: a true transparent cutout (no
// background box, card or tile around it), with only a very soft drop
// shadow for a little lift off the page. Purely decorative (never carries
// information a screen reader user would need), so it is always
// aria-hidden. Each page uses at most one, sized and placed so it never
// covers text, buttons, progress numbers or the sentence images.
function Mascot({ src, className = '', size = 120 }: MascotProps) {
  const baseUrl = import.meta.env.BASE_URL
  return (
    <img
      src={`${baseUrl}images/mascot/${src}`}
      alt=""
      aria-hidden="true"
      style={{ height: size, width: 'auto' }}
      className={`pointer-events-none select-none drop-shadow-[0_6px_10px_rgba(30,41,59,0.18)] ${className}`}
    />
  )
}

export default Mascot
