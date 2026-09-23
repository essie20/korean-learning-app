const BACKGROUND_IMAGE = 'images/backgrounds/korea-scene.webp'

// The shared, quiet ambient version of the illustrated scene, visible behind
// every page. Deliberately NOT a hand-built SVG approximation (mountains,
// circles, etc.) - it references a real illustration asset. If that file
// isn't present yet, this degrades to a plain soft colour wash (no broken
// image, no fake geometric shapes standing in for it).
function AppBackground() {
  const baseUrl = import.meta.env.BASE_URL
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 h-screen w-screen bg-[#eef1fb] bg-cover bg-center opacity-55 blur-[1px]"
      style={{ backgroundImage: `url('${baseUrl}${BACKGROUND_IMAGE}')` }}
    />
  )
}

export default AppBackground
