import { NavLink } from 'react-router'

const links = [
  { to: '/', label: 'Etusivu', end: true },
  { to: '/aiheet', label: 'Aiheet', end: false },
  { to: '/edistyminen', label: 'Edistyminen', end: false },
]

const baseClasses =
  'inline-block border-b-4 px-3 py-3 text-lg focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-blue-700'
const activeClasses = 'border-blue-700 font-bold text-slate-900'
const inactiveClasses =
  'border-transparent text-slate-700 hover:border-slate-300 hover:text-slate-900'

function NavBar() {
  return (
    <nav aria-label="Päävalikko" className="border-b border-slate-200 bg-white">
      {/* pt-2 leaves room above the links so the focus ring is not cut off */}
      <ul className="mx-auto flex max-w-3xl flex-wrap gap-x-2 px-3 pt-2">
        {links.map(({ to, label, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`
              }
            >
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default NavBar
