export type GradeId = 7 | 8 | 9 | 10 | 11
export type ThemeId = 'g7' | 'g8' | 'g9' | 'g10' | 'g11' | 'review'
export type DomainId =
  | 'mechanics'
  | 'thermal'
  | 'electricity'
  | 'waves'
  | 'optics'
  | 'molecular'
  | 'quantum'
  | 'astronomy'
  | 'methods'
  | 'custom'

export interface Topic {
  id: string
  grade: GradeId
  quarter: number
  title: string
  short: string
  domain: DomainId
  icon: string
}

export interface Quarter {
  number: number
  title: string
  topics: Topic[]
}

export interface Grade {
  id: GradeId
  label: string
  tagline: string
  description: string
  theme: ThemeId
  quarters: Quarter[]
}

export type QuestionKind = 'theory' | 'formula' | 'problem' | 'custom'

export interface Question {
  id: string
  kind: QuestionKind
  text: string
  options?: string[]
  correct?: number
  answer: string
  explanation?: string
  points: number
  topicId?: string
  grade?: GradeId
  source?: 'base' | 'custom'
}

export interface CustomQuestion extends Question {
  category: string
  source: 'custom'
}

export interface CustomBoard {
  id: string
  name: string
  description: string
  emoji: string
  theme: ThemeId
  questions: CustomQuestion[]
  createdAt: number
  updatedAt: number
  isSample?: boolean
}

export type CellKind =
  | 'start'
  | 'bonus'
  | 'rocket'
  | 'lab'
  | 'topic'
  | 'problem'
  | 'formula'
  | 'question'

export interface BoardCell {
  index: number
  kind: CellKind
  title: string
  subtitle?: string
  icon: string
  topicId?: string
  domain: DomainId
  points: number
  questionId?: string
}

export interface TeamTemplate {
  name: string
  color: string
  emoji: string
}

export interface Team extends TeamTemplate {
  id: string
  score: number
  position: number
  correct: number
  wrong: number
  captures: number
}

export interface GameConfig {
  source: 'curriculum' | 'custom'
  title: string
  subtitle: string
  themeId: ThemeId
  board: BoardCell[]
  topics: Topic[]
  customBoard?: CustomBoard
  maxMoves: number
  teamTemplates: TeamTemplate[]
  rounds: number
}

export interface BonusEvent {
  icon: string
  title: string
  description: string
  points?: number
  extraRoll?: boolean
}

export interface GameEvent {
  icon: string
  title: string
  description: string
  points?: number
  extraRoll?: boolean
}

export interface ActiveQuestion {
  question: Question
  cell: BoardCell
  points: number
  source: 'topic' | 'problem' | 'formula' | 'lab' | 'custom'
}

export interface LogEntry {
  id: number
  text: string
  tone?: 'good' | 'bad' | 'neutral'
}

export type GamePhase = 'idle' | 'moving' | 'question' | 'bonus' | 'event' | 'finished'
