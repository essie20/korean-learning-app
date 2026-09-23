import { Outlet, useLocation } from 'react-router'
import AppBackground from './AppBackground'
import HomeCanvas from './HomeCanvas'
import NavBar from './NavBar'

function Layout() {
  const { pathname } = useLocation()
  const baseUrl = import.meta.env.BASE_URL
  // Home has its own single hero illustration and must not also show the
  // shared illustrated AppBackground behind it (that produced a duplicated
  // scene - e.g. two cherry-blossom branches at once). Every other page
  // keeps the shared ambient illustration.
  const isHome = pathname === baseUrl || pathname === baseUrl.replace(/\/$/, '')

  return (
    <div className="relative min-h-screen overflow-x-clip">
      {isHome ? <HomeCanvas /> : <AppBackground />}
      <NavBar />
      {/* max-w-6xl + generous padding: this is a desktop-first product,
          designed primarily for 1280-1440px browser windows.
          wrap-anywhere: very long words wrap instead of causing sideways scrolling. */}
      <main className="relative mx-auto max-w-6xl px-6 py-10 wrap-anywhere lg:px-10 lg:py-14">
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
