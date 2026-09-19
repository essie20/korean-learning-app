import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { ProgressContext } from '../hooks/useProgress'
import { loadProgress, saveProgress } from '../utils/progress'

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

  const value = useMemo(
    () => ({ progress, markSentenceStudied, setCurrentCard }),
    [progress, markSentenceStudied, setCurrentCard],
  )

  return (
    <ProgressContext.Provider value={value}>
      {children}
    </ProgressContext.Provider>
  )
}

export default ProgressProvider
