import TopicCard from '../components/TopicCard'
import { topics } from '../data/topics'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useProgress } from '../hooks/useProgress'

function TopicsPage() {
  useDocumentTitle('Aiheet')
  const { progress } = useProgress()

  return (
    <>
      <h1 className="text-3xl font-bold text-slate-900">Aiheet</h1>
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
        {topics.map((topic) => (
          <li key={topic.id}>
            <TopicCard topic={topic} progress={progress} />
          </li>
        ))}
      </ul>
    </>
  )
}

export default TopicsPage
