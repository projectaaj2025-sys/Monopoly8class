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
  /** Код цели обучения из КТП, например 8.4.2.6 */
  goal?: string
  /** Урок, лабораторная или практическая работа */
  lesson?: 'lesson' | 'lab' | 'practice'
}

export interface Quarter {
  number: number
  title: string
  topics: Topic[]
  /** Часы по КТП */
  hours?: number
}

export interface Grade {
  id: GradeId
  label: string
  tagline: string
  description: string
  theme: ThemeId
  quarters: Quarter[]
  /** Годовая нагрузка по КТП */
  hours?: number
  note?: string
}

export type QuestionKind = 'theory' | 'formula' | 'problem' | 'practice' | 'custom'

/** Точка графика: [значение по оси X, значение по оси Y] */
export type ChartPoint = [number, number]

export interface ChartSeries {
  label?: string
  points: ChartPoint[]
  /** Пунктирная линия — для сравнения или продолжения графика */
  dashed?: boolean
}

/**
 * Небольшой график к вопросу. Рисуется прямо в модальном окне,
 * поэтому не требует картинок и работает на любом экране.
 */
export interface ChartSpec {
  xLabel: string
  yLabel: string
  series: ChartSeries[]
  xMin?: number
  xMax?: number
  yMin?: number
  yMax?: number
  xStep?: number
  yStep?: number
  caption?: string
}

export interface Question {
  id: string
  kind: QuestionKind
  text: string
  /** График или диаграмма к условию */
  chart?: ChartSpec
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
  | 'practice'
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

/** Формат подборки содержания — влияет на форму кубика и подпись игры */
export type GameFormat = 'quarter' | 'year' | 'topics' | 'custom'

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
  /** Формат игры: четверть, весь год, свои темы или авторская монополия */
  format: GameFormat
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
  source: 'topic' | 'problem' | 'formula' | 'lab' | 'practice' | 'custom'
}

export interface LogEntry {
  id: number
  text: string
  tone?: 'good' | 'bad' | 'neutral'
}

export type GamePhase = 'idle' | 'moving' | 'question' | 'bonus' | 'event' | 'finished'

/** Состояние незавершённой игры — для возврата к ней позже */
export interface GameSaveState {
  config: GameConfig
  teams: Team[]
  activeIndex: number
  turn: number
  owners: Record<number, string>
  logs: LogEntry[]
  die: number
  rollNonce: number
  /** Вопрос/бонус открыты — восстановим модалку */
  phase: 'idle' | 'question' | 'event'
  activeQuestion: ActiveQuestion | null
  pendingEvent: (BonusEvent & { eyebrow?: string }) | null
  usedIds: string[]
  savedAt: number
}

/** Краткая сводка сохранения для баннера на экране настройки */
export interface GameSaveSummary {
  title: string
  subtitle: string
  themeId: ThemeId
  savedAt: number
  turn: number
  maxMoves: number
  teams: { name: string; emoji: string; color: string; score: number; position: number }[]
}

/** Запись завершённой игры — история прохождений */
export interface GameRecord {
  id: string
  finishedAt: number
  title: string
  subtitle: string
  themeId: ThemeId
  format: GameFormat
  source: 'curriculum' | 'custom'
  winner: string[]
  turns: number
  captured: number
  totalCells: number
  teams: {
    name: string
    emoji: string
    color: string
    score: number
    correct: number
    wrong: number
    captures: number
  }[]
}
