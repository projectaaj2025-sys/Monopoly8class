import type { ChartSpec, DomainId } from '../../types'

export type SeedQuestionKind = 'theory' | 'formula' | 'problem' | 'practice'

/** [тип, вопрос, варианты, номер верного (с нуля), пояснение, график?] */
export type SeedQuestion = [
  kind: SeedQuestionKind,
  text: string,
  options: string[],
  correct: number,
  explanation: string,
  chart?: ChartSpec,
]

export interface SeedTopic {
  title: string
  short: string
  domain: DomainId
  icon: string
  /** Код цели обучения из КТП, например 7.1.1.1 */
  goal: string
  lesson?: 'lesson' | 'lab' | 'practice'
  questions: SeedQuestion[]
}

export interface SeedQuarter {
  number: number
  title: string
  hours: number
  topics: SeedTopic[]
}

export interface SeedGrade {
  id: 7 | 8 | 9 | 10 | 11
  label: string
  tagline: string
  description: string
  theme: 'g7' | 'g8' | 'g9' | 'g10' | 'g11'
  hours: number
  quarters: SeedQuarter[]
  /** Пояснение для карточки класса в настройках */
  note?: string
}

export const t = (
  title: string,
  short: string,
  domain: DomainId,
  icon: string,
  goal: string,
  questions: SeedQuestion[],
  lesson: SeedTopic['lesson'] = 'lesson',
): SeedTopic => ({ title, short, domain, icon, goal, questions, lesson })

export const q = (
  kind: SeedQuestionKind,
  text: string,
  options: string[],
  correct: number,
  explanation: string,
): SeedQuestion => [kind, text, options, correct, explanation]

export const quarter = (
  number: number,
  title: string,
  hours: number,
  topics: SeedTopic[],
): SeedQuarter => ({ number, title, hours, topics })
