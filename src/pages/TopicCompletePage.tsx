import { Link, Navigate, useParams } from 'react-router'
import { primaryButton, secondaryButton } from '../components/buttonStyles'
import { topics } from '../data/topics'
import { useProgress } from '../hooks/useProgress'
import { getCompletionCount, getTopicProgress } from '../utils/progress'

function TopicCompletePage() {
  const { topicId } = useParams()
  const { progress, setCurrentCard } = useProgress()
  const topic = topics.find((t) => t.id === topicId)

  if (!topic) {
    return <Navigate to="/aiheet" replace />
  }
  // The page is only for topics finished with Valmis
  if (getCompletionCount(progress, topic.id) < 1) {
    return <Navigate to={`/aiheet/${topic.id}/opiskelu`} replace />
  }

  const { studied, total } = getTopicProgress(progress, topic.id)

  return (
    <>
      <h1 className="text-3xl font-bold text-slate-900">Aihe suoritettu</h1>
      <p className="mt-4 text-2xl font-semibold text-slate-900">
        {topic.title}
      </p>
      <p className="mt-2 text-xl text-slate-700">
        {studied} / {total}
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        {/* Kertaa always starts the topic again from the first sentence */}
        <Link
          to={`/aiheet/${topic.id}/opiskelu`}
          className={primaryButton}
          onClick={() => setCurrentCard(topic.id, 0)}
        >
          Kertaa tämä aihe
        </Link>
        <Link to="/aiheet" className={secondaryButton}>
          Valitse toinen aihe
        </Link>
        <Link to="/" className={secondaryButton}>
          Etusivulle
        </Link>
      </div>
    </>
  )
}

export default TopicCompletePage
