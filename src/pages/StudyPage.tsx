import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router'
import { primaryButton, secondaryButton } from '../components/buttonStyles'
import SentenceCard from '../components/SentenceCard'
import { sentences } from '../data/sentences'
import { topics } from '../data/topics'
import { useProgress } from '../hooks/useProgress'
import type { Topic } from '../types/content'

interface StudySessionProps {
  topic: Topic
}

function StudySession({ topic }: StudySessionProps) {
  const navigate = useNavigate()
  const { progress, markSentenceStudied, setCurrentCard, completeTopic } =
    useProgress()
  // Start from the saved position of this topic (0-based), or the first sentence
  const [index, setIndex] = useState(progress.currentCardByTopic[topic.id] ?? 0)

  const topicSentences = sentences
    .filter((sentence) => sentence.topicId === topic.id)
    .sort((a, b) => a.order - b.order)
  const currentSentence = topicSentences[index]
  const isFirst = index === 0
  const isLast = index === topicSentences.length - 1

  // A displayed sentence counts as studied and is the topic's current card
  useEffect(() => {
    markSentenceStudied(currentSentence.id)
    setCurrentCard(topic.id, index)
  }, [currentSentence.id, topic.id, index, markSentenceStudied, setCurrentCard])

  function handleValmis() {
    completeTopic(topic.id)
    navigate(`/aiheet/${topic.id}/valmis`)
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
          onClick={() => setIndex(index - 1)}
        >
          Edellinen
        </button>
        {isLast ? (
          <button
            type="button"
            className={primaryButton}
            onClick={handleValmis}
          >
            Valmis
          </button>
        ) : (
          <button
            type="button"
            className={primaryButton}
            onClick={() => setIndex(index + 1)}
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
