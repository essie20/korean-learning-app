// The outer Home canvas: a soft, painterly backdrop that supports the hero
// illustration without repeating it. No hanok, no Seoul skyline, no
// mountains, no blossom branch here - those live only inside the hero.
// This is a watercolour wash built only from sky blue, lavender, blush pink
// and white (deliberately no yellow/cream/amber anywhere), with a small
// handful of proper petal-shaped silhouettes rather than dots or diamonds.
function Petal({
  className,
  size = 28,
  color = '#f9a8d4',
}: {
  className: string
  size?: number
  color?: string
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      className={className}
      fill="none"
    >
      {/* A rounded, pointed-top petal silhouette - reads as an organic
          cherry-blossom petal rather than a geometric diamond. */}
      <path
        d="M16 3C11 9 8 14 8 19C8 24.5 11.5 29 16 29C20.5 29 24 24.5 24 19C24 14 21 9 16 3Z"
        fill={color}
      />
    </svg>
  )
}

function HomeCanvas() {
  return (
    <div aria-hidden="true" className="fixed inset-0 -z-10 overflow-hidden">
      {/* Base atmosphere: sky blue drifting into soft lavender and blush
          pink - a varied watercolour sky, but strictly no yellow/cream. */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-100 via-indigo-50 to-pink-50" />
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-purple-50/60 to-pink-100/40" />

      {/* Large, heavily-blurred washes that blend into each other like wet
          watercolour rather than sitting as separate visible blobs. */}
      <div className="absolute -top-40 left-1/4 h-[38rem] w-[38rem] rounded-full bg-indigo-100/50 blur-[130px]" />
      <div className="absolute -top-20 -left-24 h-[30rem] w-[30rem] rounded-full bg-sky-200/40 blur-[120px]" />
      <div className="absolute top-1/4 -right-32 h-[30rem] w-[30rem] rounded-full bg-indigo-200/35 blur-[120px]" />
      <div className="absolute bottom-0 left-1/3 h-[26rem] w-[26rem] rounded-full bg-pink-200/25 blur-[130px]" />
      <div className="absolute top-1/2 left-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/30 blur-[110px]" />

      {/* A gentle soft bloom toward the upper-centre (blush pink/lavender,
          not warm/yellow) so the top of the page isn't uniformly blue. */}
      <div className="absolute -top-10 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-gradient-to-b from-pink-100/60 to-transparent blur-3xl" />
      <div className="absolute top-6 left-[20%] h-48 w-48 rounded-full bg-white/70 blur-3xl" />

      {/* Soft mist near the edges, blended rather than sharply blocked. */}
      <div className="absolute top-0 left-0 h-32 w-full bg-gradient-to-b from-white/50 to-transparent" />
      <div className="absolute bottom-0 left-0 h-48 w-full bg-gradient-to-t from-indigo-50/60 to-transparent" />

      {/* A gentle vignette so the eye settles on the hero card rather than
          the corners of the browser window. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(79,70,229,0.06)_100%)]" />

      {/* A few organic petal silhouettes, clearly petal-shaped, at varied
          sizes/rotations/opacities - a light accent, not a pattern. */}
      <Petal
        className="absolute top-24 left-[8%] -rotate-[20deg] opacity-70"
        size={28}
      />
      <Petal
        className="absolute top-44 right-[7%] rotate-[35deg] opacity-55"
        size={22}
        color="#fbcfe8"
      />
      <Petal
        className="absolute bottom-28 right-[12%] rotate-[-15deg] opacity-65"
        size={26}
      />
      <Petal
        className="absolute bottom-12 left-[22%] rotate-[60deg] opacity-50"
        size={20}
        color="#f472b6"
      />
    </div>
  )
}

export default HomeCanvas
