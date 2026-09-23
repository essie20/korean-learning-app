import Mascot from '../components/Mascot'
import TopicCard from '../components/TopicCard'
import { topics } from '../data/topics'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useProgress } from '../hooks/useProgress'
import { getOverallProgress } from '../utils/progress'

function TopicsPage() {
  useDocumentTitle('Aiheet')
  const { progress } = useProgress()
  const overall = getOverallProgress(progress)

  const baseUrl = import.meta.env.BASE_URL

  return (
    <div className="relative overflow-hidden rounded-[2.5rem] border border-white/70 bg-white/45 p-8 shadow-2xl shadow-indigo-950/10 backdrop-blur-xl lg:p-12">
      {/* Same shared illustrated scene as the rest of the app, but cropped
          toward its upper-right (blossoms/skyline) and kept fairly visible
          around the topic grid rather than tucked away. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-cover bg-[position:80%_20%] opacity-30 blur-[2px]"
        style={{
          backgroundImage: `url('${baseUrl}images/backgrounds/korea-scene.webp')`,
        }}
      />
      <div
        aria-hidden="true"
        className="absolute -top-32 -right-32 h-72 w-72 rounded-full bg-indigo-300/20 blur-3xl"
      />
      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-start gap-4">
          {/* Small studying mascot beside the heading - purely decorative,
              never overlapping the title or intro text. */}
          <Mascot
            src="mascot-study.webp"
            size={64}
            className="hidden shrink-0 sm:block"
          />
          <div>
            <p className="text-sm font-semibold tracking-wide text-blue-700 uppercase">
              선택하세요 · Valitse aihe
            </p>
            <h1 className="mt-2 text-3xl font-bold text-slate-900 lg:text-4xl">
              Aiheet
            </h1>
            <p className="mt-2 max-w-xl text-lg text-slate-600">
              Valitse aihe ja jatka opiskelua. Voit valita minkä tahansa aiheen
              missä järjestyksessä tahansa.
            </p>
          </div>
        </div>
        <p className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700">
          {overall.studied} / {overall.total} lausetta opiskeltu
        </p>
      </div>

      <ul className="relative mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {topics.map((topic) => (
          <li key={topic.id}>
            <TopicCard topic={topic} progress={progress} />
          </li>
        ))}
      </ul>
    </div>
  )
}

export default TopicsPage
