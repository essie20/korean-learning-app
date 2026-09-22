import { Link } from 'react-router'
import { primaryButton } from '../components/buttonStyles'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useProgress } from '../hooks/useProgress'
import { getOverallProgress } from '../utils/progress'

function HomePage() {
  useDocumentTitle('Etusivu')
  const { progress } = useProgress()
  const { studied, total, percent } = getOverallProgress(progress)
  const hasStarted = studied > 0

  return (
    <>
      <h1 className="text-3xl font-bold text-slate-900">Etusivu</h1>
      <p className="mt-4 text-lg text-slate-700">
        Opi hyödyllisiä korean kielen arkilauseita aiheittain. Jokainen aihe
        sisältää viisi lausetta, joita voit kuunnella ja harjoitella omaan
        tahtiisi.
      </p>

      <p className="mt-6 text-lg text-slate-900">
        Kokonaisedistyminen: {studied} / {total} · {percent}%
      </p>

      <Link to="/aiheet" className={`${primaryButton} mt-4`}>
        {hasStarted ? 'Jatka opiskelua' : 'Aloita opiskelu'}
      </Link>
    </>
  )
}

export default HomePage
