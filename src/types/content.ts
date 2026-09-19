// Static learning content (stored in TypeScript data files, never changed by the user)

export interface Topic {
  id: string
  title: string
  description: string
  order: number
  slug?: string
}

export interface Sentence {
  id: string
  topicId: string
  order: number
  korean: string
  pronunciation: string
  finnish: string
  image: string
  imageAlt: string
  audio: string
  pronunciationRuleIds?: string[]
}
