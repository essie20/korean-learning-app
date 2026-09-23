import { Link, Navigate, useParams } from 'react-router'
import { primaryButton, secondaryButton } from '../components/buttonStyles'
import Mascot from '../components/Mascot'
import { topics } from '../data/topics'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useProgress } from '../hooks/useProgress'
import { getCompletionCount, getTopicProgress } from '../utils/progress'

function TopicCompletePage() {
  const { topicId } = useParams()
  const { progress, setCurrentCard } = useProgress()
  const topic = topics.find((t) => t.id === topicId)
  useDocumentTitle(
    topic ? `Aihe suoritettu: ${topic.title}` : 'Aihe suoritettu',
  )

  if (!topic) {
    return <Navigate to="/aiheet" replace />
  }
  // The page is only for topics finished with Valmis
  if (getCompletionCount(progress, topic.id) < 1) {
    return <Navigate to={`/aiheet/${topic.id}/opiskelu`} replace />
  }

  const { studied, total } = getTopicProgress(progress, topic.id)

  return (
    <div className="relative mx-auto max-w-3xl">
      {/* No separate scenic image here - the shared page-level AppBackground
          (via Layout) already shows the illustrated scene behind this whole
          page. The success feeling comes from the translucent card itself:
          the green glow, check icon and soft accents below. */}
      <div className="relative mx-auto flex max-w-xl flex-col items-center gap-6 overflow-hidden rounded-[2.75rem] border border-white/70 bg-white/70 p-10 text-center shadow-2xl shadow-emerald-950/10 backdrop-blur-xl lg:p-16">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-52 bg-gradient-to-b from-emerald-100/80 via-teal-50/50 to-transparent"
        />
        <div
          aria-hidden="true"
          className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-emerald-300/25 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -top-10 -left-20 h-40 w-40 rounded-full bg-teal-300/20 blur-3xl"
        />

        {/* The celebratory bunny mascot is the main decorative accent on
            this page - a small check badge stays at its corner so the
            "completed" meaning is still immediately clear at a glance. */}
        <span className="relative">
          <span
            aria-hidden="true"
            className="absolute inset-0 -z-10 rounded-full bg-emerald-300/40 blur-2xl"
          />
          <Mascot src="mascot-celebrate.webp" size={190} />
          <span
            aria-hidden="true"
            className="absolute -right-2 -bottom-1 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-400 shadow-lg ring-4 ring-white"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 text-white"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
        </span>

        <div className="relative">
          <h1 className="text-sm font-semibold tracking-[0.2em] text-emerald-700 uppercase">
            Aihe suoritettu
          </h1>
          <p className="mt-3 text-4xl font-bold text-slate-900">
            {topic.title}
          </p>
          <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-1.5 text-sm font-semibold text-emerald-700">
            {studied} / {total} lausetta opiskeltu
          </p>
        </div>

        <div className="relative flex flex-wrap justify-center gap-3">
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
      </div>
    </div>
  )
}

export default TopicCompletePage
