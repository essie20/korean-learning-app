import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import SentenceCard from '../components/SentenceCard'
import { sentences } from '../data/sentences'
import { topics } from '../data/topics'
import { useProgress } from '../hooks/useProgress'
import type { Topic } from '../types/content'

const buttonBase =
  'rounded-md px-5 py-3 text-lg font-semibold focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:cursor-not-allowed disabled:opacity-50'
const primaryButton = `${buttonBase} bg-blue-700 text-white hover:bg-blue-800`
const secondaryButton = `${buttonBase} border-2 border-slate-400 bg-white text-slate-900 hover:bg-slate-100`

interface StudySessionProps {
  topic: Topic
}

function StudySession({ topic }: StudySessionProps) {
  const navigate = useNavigate()
  const { progress, markSentenceStudied, setCurrentCard } = useProgress()
  // Start from the saved position of this topic (0-based), or the first sentence
  const [index, setIndex] = useState(progress.currentCardByTopic[topic.id] ?? 0)

  const topicSentences = sentences
    .filter((sentence) => sentence.topicId === topic.id)
    .sort((a, b) => a.order - b.order)
  const currentSentence = topicSentences[index]
  const isFirst = index === 0
  const isLast = index === topicSentences.length - 1

  // A sentence counts as studied as soon as it is displayed
  useEffect(() => {
    markSentenceStudied(currentSentence.id)
  }, [currentSentence.id, markSentenceStudied])

  function goToSentence(newIndex: number) {
    setIndex(newIndex)
    setCurrentCard(topic.id, newIndex)
  }

  return (
    <>
      <h1 className="text-3xl font-bold text-slate-900">{topic.title}</h1>
      <p aria-live="polite" className="mt-2 mb-6 text-lg text-slate-700">
        {index + 1} / {topicSentences.length}
      </p>

      <SentenceCard sentence={currentSentence} />

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          className={secondaryButton}
          disabled={isFirst}
          onClick={() => goToSentence(index - 1)}
        >
          Edellinen
        </button>
        {isLast ? (
          <button
            type="button"
            className={primaryButton}
            onClick={() => navigate(`/aiheet/${topic.id}/valmis`)}
          >
            Valmis
          </button>
        ) : (
          <button
            type="button"
            className={primaryButton}
            onClick={() => goToSentence(index + 1)}
          >
            Seuraava
          </button>
        )}
      </div>
    </>
  )
}

function StudyPage() {
  const { topicId } = useParams()
  const topic = topics.find((t) => t.id === topicId)

  if (!topic) {
    return <Navigate to="/aiheet" replace />
  }

  // key makes React start a new session (sentence 1) when the topic changes
  return <StudySession key={topic.id} topic={topic} />
}

export default StudyPage
