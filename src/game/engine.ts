import { getLocale, plural as pluralLocal, verb as verbLocal } from '../i18n'
import type {
  BoardCell,
  BonusEvent,
  CellKind,
  CustomBoard,
  GameConfig,
  GameFormat,
  GradeId,
  Question,
  Team,
  TeamTemplate,
  ThemeId,
  Topic,
} from '../types'
import { BASE_QUESTIONS } from '../data/questions'
import { ALL_TOPICS, GRADES } from '../data/curriculum'
import { DOMAIN_META, THEMES } from '../data/themes'

export const RING_SIZE = 28

export const DEFAULT_TEAM_TEMPLATES: TeamTemplate[] = [
  { name: 'Ньютоны', color: 'blue', emoji: '🍎' },
  { name: 'Эйнштейны', color: 'red', emoji: '🧠' },
  { name: 'Теслы', color: 'green', emoji: '⚡' },
]

export const TEAM_PALETTE = ['blue', 'red', 'green', 'amber', 'violet']

export const DEFAULT_ROUNDS = 8

export const MAX_TEAMS = 4

export const EVERYONE_POINTS = 100

export const uid = (prefix = 'id'): string =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

/** 24 содержательные клетки вокруг поля: индексы кольца и тип. */
const CONTENT_SLOTS: { index: number; kind: CellKind }[] = [
  { index: 1, kind: 'topic' },
  { index: 2, kind: 'formula' },
  { index: 3, kind: 'topic' },
  { index: 4, kind: 'practice' },
  { index: 5, kind: 'topic' },
  { index: 6, kind: 'formula' },
  { index: 7, kind: 'topic' },
  { index: 9, kind: 'topic' },
  { index: 10, kind: 'problem' },
  { index: 11, kind: 'formula' },
  { index: 12, kind: 'topic' },
  { index: 13, kind: 'lab' },
  { index: 15, kind: 'topic' },
  { index: 16, kind: 'formula' },
  { index: 17, kind: 'topic' },
  { index: 18, kind: 'problem' },
  { index: 19, kind: 'topic' },
  { index: 20, kind: 'practice' },
  { index: 21, kind: 'topic' },
  { index: 23, kind: 'topic' },
  { index: 24, kind: 'practice' },
  { index: 25, kind: 'formula' },
  { index: 26, kind: 'topic' },
  { index: 27, kind: 'problem' },
]

const KIND_ICON: Partial<Record<CellKind, string>> = {
  formula: 'Sigma',
  problem: 'Lightbulb',
  practice: 'Wrench',
  lab: 'FlaskConical',
  question: 'FlaskConical',
}

const KIND_POINTS: Partial<Record<CellKind, number>> = {
  topic: 100,
  formula: 150,
  problem: 200,
  practice: 250,
  lab: 250,
  question: 150,
}

const KIND_TITLE: Partial<Record<CellKind, string>> = {
  formula: 'ФОРМУЛА',
  problem: 'ЗАДАЧА',
  practice: 'ПРАКТИКА',
  lab: 'ЛАБОРАТОРИЯ',
  question: 'ЗАДАНИЕ',
}

export function buildBoard(topics: Topic[]): BoardCell[] {
  const source = topics.length > 0 ? topics : ALL_TOPICS.slice(0, 1)
  const cells: BoardCell[] = []
  let n = 0
  for (let i = 0; i < RING_SIZE; i += 1) {
    if (i === 0) {
      cells.push({
        index: 0,
        kind: 'start',
        title: 'СТАРТ',
        subtitle: 'Круг: +100',
        icon: 'Flag',
        domain: 'methods',
        points: 0,
      })
      continue
    }
    if (i === 8) {
      cells.push({
        index: 8,
        kind: 'bonus',
        title: 'ПОДАРОК',
        subtitle: 'Случайный бонус',
        icon: 'Gift',
        domain: 'methods',
        points: 0,
      })
      continue
    }
    if (i === 14) {
      cells.push({
        index: 14,
        kind: 'bonus',
        title: 'БОНУС',
        subtitle: 'Карта удачи',
        icon: 'Sparkles',
        domain: 'methods',
        points: 0,
      })
      continue
    }
    if (i === 22) {
      cells.push({
        index: 22,
        kind: 'rocket',
        title: 'РАКЕТА',
        subtitle: '+250 и ещё бросок',
        icon: 'Rocket',
        domain: 'astronomy',
        points: 250,
      })
      continue
    }

    const slot = CONTENT_SLOTS.find((s) => s.index === i)
    if (!slot) continue
    const topic = source[n % source.length]
    n += 1
    const kind = slot.kind
    cells.push({
      index: i,
      kind,
      title:
        kind === 'topic' ? topic.short : (KIND_TITLE[kind] ?? 'ВОПРОС'),
      subtitle: topic.title,
      icon: kind === 'topic' ? topic.icon : (KIND_ICON[kind] ?? 'FlaskConical'),
      topicId: topic.id,
      domain: topic.domain,
      points: KIND_POINTS[kind] ?? 150,
    })
  }
  return cells.sort((a, b) => a.index - b.index)
}

export function buildCustomBoard(board: CustomBoard): BoardCell[] {
  const categories = [...new Set(board.questions.map((q) => q.category.trim()).filter(Boolean))]
  const cats = categories.length > 0 ? categories : ['Мои задания']
  const cells: BoardCell[] = []
  let n = 0
  for (let i = 0; i < RING_SIZE; i += 1) {
    if (i === 0) {
      cells.push({
        index: 0,
        kind: 'start',
        title: 'СТАРТ',
        subtitle: 'Круг: +100',
        icon: 'Flag',
        domain: 'custom',
        points: 0,
      })
      continue
    }
    if (i === 8) {
      cells.push({
        index: 8,
        kind: 'bonus',
        title: 'ПОДАРОК',
        subtitle: 'Случайный бонус',
        icon: 'Gift',
        domain: 'custom',
        points: 0,
      })
      continue
    }
    if (i === 14) {
      cells.push({
        index: 14,
        kind: 'bonus',
        title: 'БОНУС',
        subtitle: 'Карта удачи',
        icon: 'Sparkles',
        domain: 'custom',
        points: 0,
      })
      continue
    }
    if (i === 22) {
      cells.push({
        index: 22,
        kind: 'rocket',
        title: 'РАКЕТА',
        subtitle: '+250 и ещё бросок',
        icon: 'Rocket',
        domain: 'astronomy',
        points: 250,
      })
      continue
    }
    const category = cats[n % cats.length]
    n += 1
    const catQuestions = board.questions.filter((q) => q.category === category)
    const avg =
      catQuestions.length > 0
        ? Math.round(
            catQuestions.reduce((sum, item) => sum + item.points, 0) / catQuestions.length / 50,
          ) * 50
        : 150
    const points = Math.max(50, Math.min(300, avg))
    cells.push({
      index: i,
      kind: i === 13 || i === 24 ? 'lab' : 'question',
      title:
        category.length > 15 ? `${category.slice(0, 14).trim()}…` : category.toUpperCase(),
      subtitle:
        i === 13 || i === 24 ? 'Задание повышенной сложности' : 'Своё задание учителя',
      icon: i === 13 || i === 23 ? 'FlaskConical' : 'FlaskConical',
      topicId: category,
      domain: 'custom',
      points: i === 13 || i === 24 ? Math.min(300, points + 50) : points,
    })
  }
  return cells.sort((a, b) => a.index - b.index)
}

export function makeTeams(templates: TeamTemplate[]): Team[] {
  return templates.map((t, i) => ({
    ...t,
    id: `team-${i + 1}`,
    score: 0,
    position: 0,
    correct: 0,
    wrong: 0,
    captures: 0,
  }))
}

export function rollDie(): number {
  return 1 + Math.floor(Math.random() * 6)
}

export function movePosition(position: number, steps: number): { position: number; passedStart: boolean } {
  const next = (position + steps) % RING_SIZE
  const passedStart = position + steps >= RING_SIZE
  return { position: next, passedStart }
}

export const BONUS_EVENTS: BonusEvent[] = [
  {
    icon: 'Telescope',
    title: 'Открытие века',
    description: 'Вы заметили новую звёзду и получаете +200 очков.',
    points: 200,
  },
  {
    icon: 'Lightbulb',
    title: 'Озарение!',
    description: 'Идея пришла внезапно — команда получает +150 очков.',
    points: 150,
  },
  {
    icon: 'Zap',
    title: 'Энергетический импульс',
    description: 'Второй бросок кубика прямо сейчас!',
    extraRoll: true,
  },
  {
    icon: 'Gift',
    title: 'Подарок лаборатории',
    description: 'Коллеги передали набор приборов: +100 очков.',
    points: 100,
  },
  {
    icon: 'Orbit',
    title: 'Гравитационный манёвр',
    description: 'Удачный манёвр приносит +250 очков.',
    points: 250,
  },
  {
    icon: 'Atom',
    title: 'Научный прорыв',
    description: 'Команда объяснила явление лучше всех: +300 очков.',
    points: 300,
  },
  {
    icon: 'Rocket',
    title: 'Разгон',
    description: 'Ракета выходит на орбиту: +200 очков и ещё один бросок.',
    points: 200,
    extraRoll: true,
  },
  {
    icon: 'Sparkles',
    title: 'Счастливый случай',
    description: 'Кубик благоволит вам: +50 очков.',
    points: 50,
  },
]

export function pickBonus(): BonusEvent {
  return BONUS_EVENTS[Math.floor(Math.random() * BONUS_EVENTS.length)]
}

const PREFERRED_KINDS: Record<CellKind, Question['kind'][]> = {
  topic: ['theory', 'practice', 'problem', 'formula'],
  formula: ['formula', 'theory', 'problem', 'practice'],
  problem: ['problem', 'formula', 'practice', 'theory'],
  practice: ['practice', 'problem', 'theory', 'formula'],
  lab: ['practice', 'problem', 'theory', 'formula'],
  question: ['custom'],
  start: [],
  bonus: [],
  rocket: [],
}

export interface DrawResult {
  question: Question | null
  usedIds: Set<string>
}

/**
 * Подбирает вопрос для клетки.
 *
 * Для содержательных клеток тип важнее темы: клетка «Формула» должна получить
 * формулу из выбранных тем, а не первое практическое задание попавшейся темы.
 * Поэтому сначала ищем нужный тип по всей подборке, затем — по теме клетки,
 * и только потом разрешаем другой тип.
 */
export function drawQuestion(
  cell: BoardCell,
  topics: Topic[],
  customBoard: CustomBoard | undefined,
  usedIds: Set<string>,
): DrawResult {
  const used = new Set(usedIds)
  const customPool = customBoard?.questions ?? []

  const random = <T,>(pool: T[]): T => pool[Math.floor(Math.random() * pool.length)]

  const pickFresh = (pool: Question[], kind?: Question['kind']): Question | null => {
    const group = pool.filter(
      (item) => (!kind || item.kind === kind) && !used.has(item.id),
    )
    if (group.length === 0) return null
    const chosen = random(group)
    used.add(chosen.id)
    return chosen
  }

  const pickAny = (pool: Question[], kind?: Question['kind']): Question | null => {
    const group = pool.filter((item) => !kind || item.kind === kind)
    if (group.length === 0) return null
    const chosen = random(group)
    used.add(chosen.id)
    return chosen
  }

  let question: Question | null = null

  if (customBoard) {
    const byCategory = customPool.filter((item) => item.category === cell.topicId)
    question = pickFresh(byCategory) ?? pickAny(byCategory) ?? pickFresh(customPool) ?? pickAny(customPool)
    return { question, usedIds: used }
  }

  const byTopic = BASE_QUESTIONS.filter((item) => item.topicId === cell.topicId)
  const ids = new Set(topics.map((item) => item.id))
  const selected = BASE_QUESTIONS.filter((item) => item.topicId && ids.has(item.topicId))
  const kinds = PREFERRED_KINDS[cell.kind]

  if (cell.kind === 'question' || kinds.length === 0) {
    question = pickFresh(byTopic) ?? pickFresh(selected) ?? pickFresh(BASE_QUESTIONS)
  } else if (cell.kind === 'topic') {
    // Клетка названа темой — сначала берём вопрос именно этой темы.
    for (const pool of [byTopic, selected, BASE_QUESTIONS]) {
      for (const kind of kinds) {
        question = pickFresh(pool, kind)
        if (question) break
      }
      if (question) break
    }
  } else if (cell.kind === 'lab') {
    // Лабораторная клетка берёт задание из тем-лабораторий, если они есть.
    const labIds = new Set(topics.filter((item) => item.lesson === 'lab').map((item) => item.id))
    const labPool = BASE_QUESTIONS.filter((item) => item.topicId && labIds.has(item.topicId))
    question = pickFresh(labPool, 'practice') ?? pickFresh(labPool) ?? pickFresh(selected, 'practice')
    if (!question) {
      for (const kind of kinds) {
        for (const pool of [byTopic, selected, BASE_QUESTIONS]) {
          question = pickFresh(pool, kind)
          if (question) break
        }
        if (question) break
      }
    }
  } else {
    // Клетка названа типом задания — сначала ищем этот тип среди выбранных тем.
    for (const kind of kinds) {
      for (const pool of [byTopic, selected, BASE_QUESTIONS]) {
        question = pickFresh(pool, kind)
        if (question) break
      }
      if (question) break
    }
  }

  if (!question) {
    for (const pool of [byTopic, selected, BASE_QUESTIONS]) {
      question = pickAny(pool)
      if (question) break
    }
  }

  return { question, usedIds: used }
}

export function cellDomainLabel(cell: BoardCell): string {
  return DOMAIN_META[cell.domain]?.label ?? 'Физика'
}

export function cellKindLabel(kind: CellKind): string {
  switch (kind) {
    case 'start':
      return 'Старт'
    case 'bonus':
      return 'Бонус'
    case 'rocket':
      return 'Ракета'
    case 'lab':
      return 'Лаборатория'
    case 'practice':
      return 'Практика'
    case 'problem':
      return 'Задача'
    case 'formula':
      return 'Формула'
    case 'topic':
      return 'Тема'
    default:
      return 'Задание'
  }
}

export function buildGameConfig(params: {
  source: 'curriculum' | 'custom'
  topics: Topic[]
  themeId: ThemeId
  subtitle: string
  rounds: number
  teamTemplates: TeamTemplate[]
  customBoard?: CustomBoard
  format?: GameFormat
}): GameConfig {
  const { source, topics, themeId, subtitle, rounds, teamTemplates, customBoard } = params
  const title =
    source === 'custom' && customBoard
      ? customBoard.name
      : gradeTitleForTopics(topics)
  return {
    source,
    title,
    subtitle,
    themeId,
    board: source === 'custom' && customBoard ? buildCustomBoard(customBoard) : buildBoard(topics),
    topics,
    customBoard,
    maxMoves: rounds * Math.max(1, teamTemplates.length),
    teamTemplates,
    rounds,
    format: params.format ?? (source === 'custom' ? 'custom' : 'quarter'),
  }
}

export function gradeTitleForTopics(topics: Topic[]): string {
  const grades = [...new Set(topics.map((t) => t.grade))].sort((a, b) => a - b)
  if (grades.length === 0) return 'Физика-Поли'
  if (grades.length === 1) {
    const grade = GRADES[grades[0] as GradeId]
    return `${grade.label} · ${THEMES[grade.theme].name}`
  }
  return `Итоговое повторение · ${grades[0]}–${grades[grades.length - 1]} классы`
}

export function questionsForTopics(topics: Topic[]): Question[] {
  const ids = new Set(topics.map((t) => t.id))
  return BASE_QUESTIONS.filter((item) => item.topicId && ids.has(item.topicId))
}

export function countQuestions(topics: Topic[]): number {
  return questionsForTopics(topics).length
}

export function totalMoves(config: GameConfig): number {
  return config.rounds * Math.max(1, config.teamTemplates.length)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(value)
}

/** Склонение глагола по названию команды: «Ньютоны бросают», «Молния бросает». */
export function teamVerb(name: string | undefined, plural: string, singular: string): string {
  if (getLocale() !== 'ru') return verbLocal(plural, plural)
  const trimmed = (name ?? '').trim().toLowerCase()
  if (!trimmed) return plural
  const last = trimmed.slice(-1)
  if (last === 'ы' || last === 'и') return plural
  return singular
}

export function pluralize(n: number, one: string, few: string, many: string): string {
  return pluralLocal(n, one, few, many)
}

export const themeForGrade = (grade: GradeId): ThemeId => GRADES[grade].theme
