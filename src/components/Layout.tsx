import { Outlet } from 'react-router'
import NavBar from './NavBar'

function Layout() {
  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-3xl p-6">
        <Outlet />
      </main>
    </>
  )
}

export default Layout
