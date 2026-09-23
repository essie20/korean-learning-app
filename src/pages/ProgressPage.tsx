import { useState } from 'react'
import { secondaryButton } from '../components/buttonStyles'
import ConfirmDialog from '../components/ConfirmDialog'
import Mascot from '../components/Mascot'
import ProgressRing from '../components/ProgressRing'
import TopicCard from '../components/TopicCard'
import { topics } from '../data/topics'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useProgress } from '../hooks/useProgress'
import { getCompletionCount, getOverallProgress } from '../utils/progress'

function ProgressPage() {
  useDocumentTitle('Edistyminen')
  const { progress, resetProgress } = useProgress()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const overall = getOverallProgress(progress)
  const completedTopics = topics.filter(
    (topic) => getCompletionCount(progress, topic.id) > 0,
  ).length
  const totalCompletions = topics.reduce(
    (sum, topic) => sum + getCompletionCount(progress, topic.id),
    0,
  )

  function handleConfirm() {
    resetProgress()
    setConfirmOpen(false)
  }

  const baseUrl = import.meta.env.BASE_URL

  return (
    <div className="relative overflow-hidden rounded-[2.5rem] border border-white/70 bg-white/45 p-8 shadow-2xl shadow-indigo-950/10 backdrop-blur-xl lg:p-12">
      {/* Same shared scene again, this time a quiet lower-left/landscape
          crop with more blur so it stays subtle behind the dashboard. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-cover bg-[position:20%_70%] opacity-20 blur-[3px]"
        style={{
          backgroundImage: `url('${baseUrl}images/backgrounds/korea-scene.webp')`,
        }}
      />
      <div
        aria-hidden="true"
        className="absolute -top-32 -left-24 h-72 w-72 rounded-full bg-blue-300/20 blur-3xl"
      />
      <h1 className="relative text-3xl font-bold text-slate-900 lg:text-4xl">
        Edistyminen
      </h1>

      <section className="relative mt-8 grid grid-cols-1 gap-8 overflow-hidden rounded-[2rem] bg-gradient-to-br from-white/90 to-blue-50/60 p-8 shadow-lg shadow-indigo-950/5 sm:grid-cols-2 sm:items-center lg:grid-cols-[auto_1fr_1fr_1fr] lg:p-10">
        {/* Studying mascot tucked into the corner of the summary card -
            decorative only, positioned so it never sits over the
            percentage, ring or numbers. */}
        <Mascot
          src="mascot-study.webp"
          size={76}
          className="absolute top-4 right-4 hidden lg:block"
        />
        <div className="relative mx-auto">
          <ProgressRing percent={overall.percent} size={140} strokeWidth={13} />
          <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-slate-900">
            {overall.percent}%
          </div>
        </div>
        <div className="text-center sm:text-left">
          <p className="text-sm text-slate-500">Kokonaisedistyminen</p>
          <p className="text-2xl font-bold text-slate-900">
            {overall.studied} / {overall.total} lausetta
          </p>
        </div>
        <div className="text-center sm:text-left">
          <p className="text-sm text-slate-500">Suoritetut aiheet</p>
          <p className="text-2xl font-bold text-slate-900">
            {completedTopics} / {topics.length}
          </p>
        </div>
        <div className="text-center sm:text-left">
          <p className="text-sm text-slate-500">Suoritukset yhteensä</p>
          <p className="text-2xl font-bold text-slate-900">
            {totalCompletions}
          </p>
        </div>
      </section>

      <h2 className="relative mt-12 text-xl font-bold text-slate-900">
        Aiheiden edistyminen
      </h2>
      <ul className="relative mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map((topic) => (
          <li key={topic.id}>
            <TopicCard topic={topic} progress={progress} />
          </li>
        ))}
      </ul>

      <section className="relative mt-12 rounded-[1.75rem] border border-red-100 bg-gradient-to-br from-red-50/70 to-white/40 p-6">
        <h2 className="text-lg font-bold text-slate-900">
          Edistymisen nollaus
        </h2>
        <p className="mt-2 text-slate-700">
          Tämä poistaa kaikki tallennetut tiedot opiskelluista lauseista,
          aiheiden suorituksista ja kertauksista.
        </p>
        <button
          type="button"
          className={`${secondaryButton} mt-4`}
          onClick={() => setConfirmOpen(true)}
        >
          Nollaa edistyminen
        </button>
      </section>

      <ConfirmDialog
        open={confirmOpen}
        title="Nollataanko edistyminen?"
        message="Kaikki tallennettu edistyminen poistetaan. Tätä ei voi perua."
        cancelLabel="Peruuta"
        confirmLabel="Nollaa edistyminen"
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleConfirm}
      />
    </div>
  )
}

export default ProgressPage
