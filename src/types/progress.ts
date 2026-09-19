// The only progress data saved in localStorage.
// Percentages, statuses and other values are calculated from these.

export interface ProgressData {
  // Ids of all sentences that have been displayed at least once
  studiedSentenceIds: string[]
  // Current sentence position in each topic, keyed by topic id
  currentCardByTopic: Record<string, number>
  // Number of times each topic has been completed (Valmis), keyed by topic id
  completionCountByTopic: Record<string, number>
}
