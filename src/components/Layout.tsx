import { Outlet } from 'react-router'
import NavBar from './NavBar'

function Layout() {
  return (
    <>
      <NavBar />
      {/* wrap-anywhere: very long words wrap instead of causing sideways scrolling */}
      <main className="mx-auto max-w-3xl p-6 wrap-anywhere">
        <Outlet />
      </main>
    </>
  )
}

export default Layout
