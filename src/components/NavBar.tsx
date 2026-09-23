import { Link, NavLink } from 'react-router'
import KoreanGateLogo from './KoreanGateLogo'

const links = [
  { to: '/', label: 'Etusivu', end: true },
  { to: '/aiheet', label: 'Aiheet', end: false },
  { to: '/edistyminen', label: 'Edistyminen', end: false },
]

const linkBase =
  'relative inline-block px-1 py-2 text-base font-semibold transition-colors focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-blue-700 after:absolute after:-bottom-0.5 after:left-0 after:h-0.5 after:rounded-full after:transition-all'
const linkActive = 'text-blue-700 after:w-full after:bg-blue-600'
const linkInactive =
  'text-slate-600 after:w-0 after:bg-blue-600 hover:text-slate-900'

function NavBar() {
  return (
    <nav
      aria-label="Päävalikko"
      className="sticky top-0 z-10 border-b border-white/60 bg-white/80 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-4 lg:px-10">
        <Link
          to="/"
          className="flex items-center gap-3 rounded-md focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
        >
          <KoreanGateLogo className="h-8 w-8 text-blue-700" />
          <span className="flex flex-col leading-tight">
            <span className="text-lg font-bold tracking-tight text-slate-900">
              Koreaa lauseilla
            </span>
            <span className="text-xs text-slate-500">
              Pieniä lauseita, suuria hetkiä
            </span>
          </span>
        </Link>
        <ul className="flex flex-wrap items-center gap-6">
          {links.map(({ to, label, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `${linkBase} ${isActive ? linkActive : linkInactive}`
                }
              >
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  )
}

export default NavBar
