import { Link } from 'react-router'
import Mascot from '../components/Mascot'
import ProgressRing from '../components/ProgressRing'
import { topics } from '../data/topics'
import { sentences } from '../data/sentences'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useProgress } from '../hooks/useProgress'
import { getCompletionCount, getOverallProgress } from '../utils/progress'

const features = [
  {
    title: '10 arjen aihetta',
    text: 'Tervehdyksistä ravintolaan – kattavat aiheet arkeen.',
    tint: 'from-blue-500 to-blue-600',
    icon: (
      <path d="M4 5.5C4 4.7 4.7 4 5.5 4H12v16H5.5A1.5 1.5 0 0 1 4 18.5v-13ZM20 5.5c0-.8-.7-1.5-1.5-1.5H12v16h6.5c.8 0 1.5-.7 1.5-1.5v-13Z" />
    ),
  },
  {
    title: '50 hyödyllistä lausetta',
    text: 'Oikeita, käytännöllisiä lauseita oikeisiin tilanteisiin.',
    tint: 'from-indigo-500 to-indigo-600',
    icon: (
      <path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-4 4v-4H6a2 2 0 0 1-2-2V5Z" />
    ),
  },
  {
    title: 'Seuraa edistymistäsi',
    text: 'Näe, kuinka monta lausetta olet käynyt läpi.',
    tint: 'from-fuchsia-500 to-pink-500',
    icon: <path d="M5 20V10M12 20V4M19 20v-7" />,
  },
]

const HERO_IMAGE = 'images/backgrounds/korea-scene-hero.webp'

function HomePage() {
  useDocumentTitle('Etusivu')
  const baseUrl = import.meta.env.BASE_URL
  const { progress } = useProgress()
  const { studied, total, percent } = getOverallProgress(progress)
  const hasStarted = studied > 0
  const startedTopics = topics.filter((t) =>
    progress.studiedSentenceIds.some((id) => id.startsWith(t.id)),
  ).length
  const completedTopics = topics.filter(
    (t) => getCompletionCount(progress, t.id) > 0,
  ).length

  return (
    <div className="overflow-hidden rounded-[2.5rem] border border-white/70 bg-white/40 shadow-2xl shadow-indigo-950/10 backdrop-blur-xl">
      {/* The hero illustration below is the one and only scenic image on
          this page - Layout swaps out the shared AppBackground for a plain
          pastel canvas on the Home route specifically so it never shows a
          second, duplicated landscape behind this section. */}
      <div className="relative isolate overflow-hidden px-8 py-16 lg:px-16 lg:py-24">
        {/* The illustrated scene, shown prominently here. Until the real
            asset exists at HERO_IMAGE this is invisible and the section
            just shows its own soft background colour - never a broken
            image or a fake shape standing in for it. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[#e0e7ff] bg-cover bg-[position:75%_center]"
          style={{ backgroundImage: `url('${baseUrl}${HERO_IMAGE}')` }}
        />
        {/* Legibility wash so the left-side text stays readable over any
            part of the scene, however busy. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-white/85 via-white/45 to-transparent"
        />
        <div className="relative grid grid-cols-1 gap-12 lg:grid-cols-[1.2fr_1fr] lg:items-center">
          <div className="flex flex-col items-start gap-5">
            <p
              lang="ko"
              className="text-xl font-semibold tracking-wide text-indigo-700"
            >
              안녕하세요!
            </p>
            <h1 className="text-5xl leading-[1.05] font-bold text-balance text-slate-900 lg:text-6xl">
              Opi koreaa
              <br />
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                arkilauseilla
              </span>
            </h1>
            <p className="max-w-lg text-lg text-slate-700">
              Opi hyödyllisiä korean kielen arkilauseita aiheittain. Jokainen
              aihe sisältää viisi lausetta, joita voit kuunnella ja harjoitella
              omaan tahtiisi.
            </p>
            <div className="flex items-center gap-3">
              <Link
                to="/aiheet"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-blue-600/30 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-600/40 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
              >
                {hasStarted ? 'Jatka opiskelua' : 'Aloita opiskelu'}
                <span aria-hidden="true">→</span>
              </Link>
              {/* The waving bunny mascot sits beside the CTA, not on top of
                  it, so it never covers the button or its label. */}
              <Mascot src="mascot-wave.webp" size={72} className="shrink-0" />
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 rounded-[2rem] border border-white/70 bg-white/85 p-8 shadow-xl shadow-indigo-950/10 backdrop-blur">
            <div className="relative">
              <ProgressRing percent={percent} size={172} strokeWidth={14} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-slate-900">
                  {percent}%
                </span>
                <span className="text-xs font-medium text-slate-500">
                  valmiina
                </span>
              </div>
            </div>
            <p className="text-lg font-bold text-slate-900">
              {studied} / {total} lausetta
            </p>

            <div className="grid w-full grid-cols-2 gap-3 border-t border-slate-100 pt-4">
              <div className="rounded-xl bg-blue-50 px-3 py-2 text-center">
                <p className="text-xl font-bold text-blue-700">
                  {startedTopics}
                </p>
                <p className="text-xs text-slate-600">aihetta aloitettu</p>
              </div>
              <div className="rounded-xl bg-emerald-50 px-3 py-2 text-center">
                <p className="text-xl font-bold text-emerald-700">
                  {completedTopics}
                </p>
                <p className="text-xs text-slate-600">aihetta suoritettu</p>
              </div>
            </div>

            <Link
              to="/edistyminen"
              className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition-colors hover:bg-blue-100 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
            >
              Katso edistyminen
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-white/70 bg-gradient-to-b from-indigo-50/50 to-white/60 px-8 py-12 lg:px-16">
        <dl className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="flex flex-col items-center gap-3 rounded-3xl border border-white/70 bg-white/80 p-6 text-center shadow-md shadow-indigo-950/5 transition-transform hover:-translate-y-1"
            >
              <span
                className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${f.tint} text-white shadow-md`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.75}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="h-7 w-7"
                >
                  {f.icon}
                </svg>
              </span>
              <dt className="text-lg font-bold text-slate-900">{f.title}</dt>
              <dd className="text-sm text-slate-600">{f.text}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-8 text-center text-xs font-medium text-slate-400">
          {topics.length} aihetta · {sentences.length} lausetta
        </p>
      </div>
    </div>
  )
}

export default HomePage
