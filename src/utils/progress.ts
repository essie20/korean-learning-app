import { sentences } from '../data/sentences'
import type { ProgressData } from '../types/progress'

export const STORAGE_KEY = 'korean-learning-app-progress'

// --- Known content, used to validate stored data ---

const validSentenceIds = new Set(sentences.map((sentence) => sentence.id))

const sentenceCountByTopic = new Map<string, number>()
for (const sentence of sentences) {
  sentenceCountByTopic.set(
    sentence.topicId,
    (sentenceCountByTopic.get(sentence.topicId) ?? 0) + 1,
  )
}

// --- Loading and saving ---

export function createEmptyProgress(): ProgressData {
  return {
    studiedSentenceIds: [],
    currentCardByTopic: {},
    completionCountByTopic: {},
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// Turns anything read from storage into safe ProgressData.
// Invalid sentence ids, topic ids, card positions and counts are dropped.
export function sanitizeProgress(raw: unknown): ProgressData {
  const progress = createEmptyProgress()
  if (!isRecord(raw)) return progress

  if (Array.isArray(raw.studiedSentenceIds)) {
    const validIds = raw.studiedSentenceIds.filter(
      (id): id is string => typeof id === 'string' && validSentenceIds.has(id),
    )
    progress.studiedSentenceIds = [...new Set(validIds)]
  }

  if (isRecord(raw.currentCardByTopic)) {
    for (const [topicId, card] of Object.entries(raw.currentCardByTopic)) {
      const sentenceCount = sentenceCountByTopic.get(topicId)
      if (
        sentenceCount !== undefined &&
        Number.isInteger(card) &&
        (card as number) >= 0 &&
        (card as number) < sentenceCount
      ) {
        progress.currentCardByTopic[topicId] = card as number
      }
    }
  }

  if (isRecord(raw.completionCountByTopic)) {
    for (const [topicId, count] of Object.entries(raw.completionCountByTopic)) {
      if (
        sentenceCountByTopic.has(topicId) &&
        Number.isInteger(count) &&
        (count as number) >= 0
      ) {
        progress.completionCountByTopic[topicId] = count as number
      }
    }
  }

  return progress
}

export function loadProgress(): ProgressData {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === null) return createEmptyProgress()
    return sanitizeProgress(JSON.parse(stored))
  } catch {
    // Storage unavailable or the stored text is not valid JSON
    return createEmptyProgress()
  }
}

export function saveProgress(progress: ProgressData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // Storage unavailable or full: the app keeps working without saving
  }
}

// --- Values calculated from the stored data (never stored themselves) ---

export interface ProgressSummary {
  studied: number
  total: number
  percent: number
}

function toSummary(studied: number, total: number): ProgressSummary {
  const percent = total === 0 ? 0 : Math.round((studied / total) * 100)
  return { studied, total, percent }
}

// How many times the topic has been completed with Valmis
export function getCompletionCount(
  progress: ProgressData,
  topicId: string,
): number {
  return progress.completionCountByTopic[topicId] ?? 0
}

export interface RepetitionProgress {
  position: number
  total: number
  percent: number
}

// A topic is being repeated when it has been completed at least once AND has a
// saved current card (the card is cleared when a pass is completed).
// Progress is the position in the current pass, so coverage is never affected.
// Returns null when the topic is not being repeated.
export function getRepetitionProgress(
  progress: ProgressData,
  topicId: string,
): RepetitionProgress | null {
  const card = progress.currentCardByTopic[topicId]
  if (getCompletionCount(progress, topicId) < 1 || card === undefined) {
    return null
  }
  const total = sentenceCountByTopic.get(topicId) ?? 0
  const position = card + 1
  return {
    position,
    total,
    percent: total === 0 ? 0 : Math.round((position / total) * 100),
  }
}

// Unique sentences viewed at least once / all sentences
export function getOverallProgress(progress: ProgressData): ProgressSummary {
  const studied = new Set(
    progress.studiedSentenceIds.filter((id) => validSentenceIds.has(id)),
  )
  return toSummary(studied.size, sentences.length)
}

// Unique sentences viewed in one topic / sentences in that topic
export function getTopicProgress(
  progress: ProgressData,
  topicId: string,
): ProgressSummary {
  const topicSentenceIds = sentences
    .filter((sentence) => sentence.topicId === topicId)
    .map((sentence) => sentence.id)
  const studied = topicSentenceIds.filter((id) =>
    progress.studiedSentenceIds.includes(id),
  ).length
  return toSummary(studied, topicSentenceIds.length)
}
