// A small line-art mark evoking a hanok gate/pagoda roofline - the app's
// brand mark. Purely decorative.
function KoreanGateLogo({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d="M3 13 16 5l13 8" />
      <path d="M3 13h26" />
      <path d="M7 13v15M25 13v15" />
      <path d="M16 13v15" />
      <path d="M10 28h12" />
    </svg>
  )
}

export default KoreanGateLogo
