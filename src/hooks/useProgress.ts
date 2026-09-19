import { createContext, useContext } from 'react'
import type { ProgressData } from '../types/progress'

export interface ProgressContextValue {
  progress: ProgressData
  markSentenceStudied: (sentenceId: string) => void
  setCurrentCard: (topicId: string, index: number) => void
}

export const ProgressContext = createContext<ProgressContextValue | null>(null)

export function useProgress(): ProgressContextValue {
  const value = useContext(ProgressContext)
  if (value === null) {
    throw new Error('useProgress must be used inside <ProgressProvider>')
  }
  return value
}
