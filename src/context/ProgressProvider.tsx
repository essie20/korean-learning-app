import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ProgressContext } from '../hooks/useProgress'
import {
  createEmptyProgress,
  loadProgress,
  saveProgress,
} from '../utils/progress'

interface ProgressProviderProps {
  children: ReactNode
}

function ProgressProvider({ children }: ProgressProviderProps) {
  const [progress, setProgress] = useState(loadProgress)

  // Save to localStorage whenever the progress changes
  useEffect(() => {
    saveProgress(progress)
  }, [progress])

  // Adds the sentence id once. Returning the same object means no update.
  const markSentenceStudied = useCallback((sentenceId: string) => {
    setProgress((current) =>
      current.studiedSentenceIds.includes(sentenceId)
        ? current
        : {
            ...current,
            studiedSentenceIds: [...current.studiedSentenceIds, sentenceId],
          },
    )
  }, [])

  const setCurrentCard = useCallback((topicId: string, index: number) => {
    setProgress((current) =>
      current.currentCardByTopic[topicId] === index
        ? current
        : {
            ...current,
            currentCardByTopic: {
              ...current.currentCardByTopic,
              [topicId]: index,
            },
          },
    )
  }, [])

  // Adds one completion and clears the saved card, which ends the current pass.
  // Studied sentences are not touched, so coverage is never reduced.
  const completeTopic = useCallback((topicId: string) => {
    setProgress((current) => {
      const currentCardByTopic = { ...current.currentCardByTopic }
      delete currentCardByTopic[topicId]
      return {
        ...current,
        currentCardByTopic,
        completionCountByTopic: {
          ...current.completionCountByTopic,
          [topicId]: (current.completionCountByTopic[topicId] ?? 0) + 1,
        },
      }
    })
  }, [])

  // Back to the empty state (the save effect stores the empty data)
  const resetProgress = useCallback(() => {
    setProgress(createEmptyProgress())
  }, [])

  const value = useMemo(
    () => ({
      progress,
      markSentenceStudied,
      setCurrentCard,
      completeTopic,
      resetProgress,
    }),
    [
      progress,
      markSentenceStudied,
      setCurrentCard,
      completeTopic,
      resetProgress,
    ],
  )

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  )
}

export default ProgressProvider
