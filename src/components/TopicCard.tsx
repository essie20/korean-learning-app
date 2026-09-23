import { Link } from 'react-router'
import ProgressBar from './ProgressBar'
import StatusBadge from './StatusBadge'
import type { TopicStatus } from './StatusBadge'
import TopicIcon from './topicIcons'
import {
  getCompletionCount,
  getRepetitionProgress,
  getTopicProgress,
} from '../utils/progress'
import type { Topic } from '../types/content'
import type { ProgressData } from '../types/progress'

interface TopicCardProps {
  topic: Topic
  progress: ProgressData
}

const surfaceByStatus: Record<TopicStatus, string> = {
  Aloita: 'border-slate-200 bg-white/85 hover:border-blue-200',
  Jatka:
    'border-amber-200 bg-gradient-to-br from-amber-50/80 to-white hover:border-amber-300',
  Suoritettu:
    'border-emerald-200 bg-gradient-to-br from-emerald-50/80 to-white hover:border-emerald-300',
}
const accentByStatus: Record<TopicStatus, string> = {
  Aloita: 'bg-slate-200',
  Jatka: 'bg-gradient-to-r from-amber-400 to-orange-500',
  Suoritettu: 'bg-gradient-to-r from-emerald-400 to-teal-500',
}
const iconByStatus: Record<TopicStatus, string> = {
  Aloita: 'bg-blue-50 text-blue-700',
  Jatka: 'bg-amber-100 text-amber-700',
  Suoritettu: 'bg-emerald-100 text-emerald-700',
}

// One topic's title, progress and status. Used on both Topics and Progress,
// which is why it reads progress data instead of duplicating the logic.
function TopicCard({ topic, progress }: TopicCardProps) {
  const { studied, total, percent } = getTopicProgress(progress, topic.id)
  const completionCount = getCompletionCount(progress, topic.id)
  const repetition = getRepetitionProgress(progress, topic.id)
  const isCompleted = completionCount > 0

  const status: TopicStatus = isCompleted
    ? 'Suoritettu'
    : studied > 0
      ? 'Jatka'
      : 'Aloita'

  return (
    <Link
      to={`/aiheet/${topic.id}/opiskelu`}
      className={`group relative flex flex-col gap-4 overflow-hidden rounded-3xl border p-5 shadow-sm backdrop-blur transition-all hover:-translate-y-1 hover:shadow-lg focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-blue-700 ${surfaceByStatus[status]}`}
    >
      <span
        aria-hidden="true"
        className={`absolute inset-x-0 top-0 h-1.5 ${accentByStatus[status]}`}
      />

      <div className="flex items-start justify-between gap-3">
        <span
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-sm font-bold shadow-sm ${iconByStatus[status]}`}
        >
          <TopicIcon order={topic.order} className="h-6 w-6" />
        </span>
        <StatusBadge status={status} />
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-400">
          Aihe {String(topic.order).padStart(2, '0')}
        </p>
        <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700">
          {topic.title}
        </h3>
        <p className="mt-1 text-sm text-slate-600">
          {studied} / {total} lausetta · {percent}%
        </p>
      </div>

      <ProgressBar
        percent={percent}
        className="h-2"
        fillClassName={
          status === 'Suoritettu'
            ? 'bg-gradient-to-r from-emerald-400 to-teal-500'
            : status === 'Jatka'
              ? 'bg-gradient-to-r from-amber-400 to-orange-500'
              : 'bg-gradient-to-r from-blue-500 to-indigo-600'
        }
      />

      {isCompleted && (
        <p className="text-xs text-slate-500">
          Suoritettu {completionCount}{' '}
          {completionCount === 1 ? 'kerran' : 'kertaa'}
          {repetition &&
            ` · Kertaus käynnissä: ${repetition.position} / ${repetition.total}`}
        </p>
      )}
    </Link>
  )
}

export default TopicCard
