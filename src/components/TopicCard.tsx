import { Link } from 'react-router'
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

// One topic's title, progress and status. Used on both Topics and Progress,
// which is why it reads progress data instead of duplicating the logic.
function TopicCard({ topic, progress }: TopicCardProps) {
  const { studied, total, percent } = getTopicProgress(progress, topic.id)
  const completionCount = getCompletionCount(progress, topic.id)
  const repetition = getRepetitionProgress(progress, topic.id)
  const isCompleted = completionCount > 0

  const status = isCompleted ? 'Suoritettu' : studied > 0 ? 'Jatka' : 'Aloita'

  return (
    <Link
      to={`/aiheet/${topic.id}/opiskelu`}
      className="block rounded-lg border border-slate-200 bg-white p-4 hover:border-blue-700 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-xl font-bold text-slate-900">{topic.title}</span>
        <span className="text-lg font-semibold text-blue-700">{status}</span>
      </div>
      <p className="mt-1 text-slate-700">
        {studied} / {total} · {percent}%
      </p>
      {isCompleted && (
        <p className="mt-1 text-sm text-slate-600">
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
