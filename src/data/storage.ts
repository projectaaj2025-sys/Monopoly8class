import type { CustomBoard, CustomQuestion, GameRecord, GameSaveState, GameSaveSummary, ThemeId } from '../types'
import { uid } from '../game/engine'

const BOARDS_KEY = 'fizika-poli.custom-boards.v1'
const SEED_KEY = 'fizika-poli.seeded.v1'
const SAVE_KEY = 'fizika-poli.game-save.v1'
const HISTORY_KEY = 'fizika-poli.history.v1'
const HISTORY_LIMIT = 30

const safeParse = <T>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export const sampleQuestions: CustomQuestion[] = [
  {
    id: 'sample-q1',
    kind: 'custom',
    source: 'custom',
    category: 'Механика',
    text: 'Автомобиль проехал 180 км за 3 часа. Какова его средняя скорость?',
    options: ['60 км/ч', '90 км/ч', '540 км/ч', '30 км/ч'],
    correct: 0,
    answer: '60 км/ч',
    explanation: 'v = s / t = 180 : 3 = 60 км/ч.',
    points: 100,
  },
  {
    id: 'sample-q2',
    kind: 'custom',
    source: 'custom',
    category: 'Механика',
    text: 'Почему при резком торможении автобуса пассажиры наклоняются вперёд?',
    options: [
      'Из-за явления инерции',
      'Из-за силы тяжести',
      'Из-за уменьшения массы',
      'Из-за электризации',
    ],
    correct: 0,
    answer: 'Из-за явления инерции',
    explanation: 'Тело сохраняет скорость, поэтому при торможении автобуса пассажир продолжает двигаться вперёд.',
    points: 100,
  },
  {
    id: 'sample-q3',
    kind: 'custom',
    source: 'custom',
    category: 'Тепло',
    text: 'Сколько теплоты нужно, чтобы нагреть 1 кг воды на 20 °C? c = 4200 Дж/(кг·°C).',
    options: ['84 кДж', '42 кДж', '8,4 кДж', '420 кДж'],
    correct: 0,
    answer: '84 кДж',
    explanation: 'Q = cmΔt = 4200 · 1 · 20 = 84 000 Дж = 84 кДж.',
    points: 150,
  },
  {
    id: 'sample-q4',
    kind: 'custom',
    source: 'custom',
    category: 'Тепло',
    text: 'Какой вид теплопередачи не требует наличия вещества?',
    options: ['Излучение', 'Теплопроводность', 'Конвекция', 'Все требуют'],
    correct: 0,
    answer: 'Излучение',
    explanation: 'Излучение распространяется в вакууме, например от Солнца до Земли.',
    points: 100,
  },
  {
    id: 'sample-q5',
    kind: 'custom',
    source: 'custom',
    category: 'Электричество',
    text: 'Напряжение на лампе 12 В, сопротивление 6 Ом. Найдите силу тока.',
    options: ['2 А', '72 А', '0,5 А', '18 А'],
    correct: 0,
    answer: '2 А',
    explanation: 'По закону Ома I = U / R = 12 : 6 = 2 А.',
    points: 150,
  },
  {
    id: 'sample-q6',
    kind: 'custom',
    source: 'custom',
    category: 'Электричество',
    text: 'Что является носителем заряда в металлическом проводнике?',
    options: ['Свободные электроны', 'Протоны', 'Ионы', 'Нейтроны'],
    correct: 0,
    answer: 'Свободные электроны',
    explanation: 'В металлах электрический ток создаётся направленным движением свободных электронов.',
    points: 100,
  },
  {
    id: 'sample-q7',
    kind: 'custom',
    source: 'custom',
    category: 'Оптика',
    text: 'Угол падения света на зеркало 30°. Чему равен угол отражения?',
    options: ['30°', '60°', '90°', '0°'],
    correct: 0,
    answer: '30°',
    explanation: 'По закону отражения угол отражения равен углу падения.',
    points: 100,
  },
  {
    id: 'sample-q8',
    kind: 'custom',
    source: 'custom',
    category: 'Оптика',
    text: 'Почему белый свет в призме распадается на цвета?',
    options: [
      'Из-за дисперсии — разной скорости света разных цветов',
      'Из-за отражения',
      'Из-за поглощения',
      'Из-за дифракции на краях',
    ],
    correct: 0,
    answer: 'Из-за дисперсии — разной скорости света разных цветов',
    explanation: 'Показатель преломления зависит от длины волны, поэтому цвета отклоняются по-разному.',
    points: 150,
  },
  {
    id: 'sample-q9',
    kind: 'custom',
    source: 'custom',
    category: 'Космос',
    text: 'Сколько времени идёт свет от Солнца до Земли?',
    options: ['Около 8 минут', 'Около 8 секунд', 'Около 8 часов', 'Около 1 суток'],
    correct: 0,
    answer: 'Около 8 минут',
    explanation: 'Расстояние 150 млн км, свет проходит его примерно за 500 секунд — около 8 минут.',
    points: 100,
  },
  {
    id: 'sample-q10',
    kind: 'custom',
    source: 'custom',
    category: 'Космос',
    text: 'Что такое световой год?',
    options: [
      'Расстояние, которое свет проходит за год',
      'Время оборота Земли вокруг Солнца',
      'Период вращения галактики',
      'Масса звезды',
    ],
    correct: 0,
    answer: 'Расстояние, которое свет проходит за год',
    explanation: 'Световой год — единица расстояния, примерно 9,46 · 10¹² км.',
    points: 100,
  },
]

export const sampleBoard = (): CustomBoard => {
  const now = Date.now()
  return {
    id: 'sample-board',
    name: 'Физика вокруг нас',
    description:
      'Пример авторской монополии: пять категорий и десять заданий. Можно отредактировать под свой класс.',
    emoji: '🧠',
    theme: 'g9',
    questions: sampleQuestions,
    createdAt: now,
    updatedAt: now,
    isSample: true,
  }
}

export function loadCustomBoards(): CustomBoard[] {
  if (typeof window === 'undefined') return []
  const boards = safeParse<CustomBoard[]>(window.localStorage.getItem(BOARDS_KEY), [])
  return Array.isArray(boards) ? boards : []
}

export function saveCustomBoards(boards: CustomBoard[]): void {
  try {
    window.localStorage.setItem(BOARDS_KEY, JSON.stringify(boards))
  } catch {
    /* хранилище может быть недоступно */
  }
}

export function ensureSeed(): void {
  try {
    if (window.localStorage.getItem(SEED_KEY)) return
    window.localStorage.setItem(SEED_KEY, '1')
    if (loadCustomBoards().length === 0) {
      saveCustomBoards([sampleBoard()])
    }
  } catch {
    /* ignore */
  }
}

export function blankBoard(): CustomBoard {
  const now = Date.now()
  return {
    id: uid('board'),
    name: '',
    description: '',
    emoji: '⚛️',
    theme: 'g7' as ThemeId,
    questions: [],
    createdAt: now,
    updatedAt: now,
  }
}

export function blankQuestion(category = ''): CustomQuestion {
  return {
    id: uid('cq'),
    kind: 'custom',
    source: 'custom',
    category,
    text: '',
    options: ['', '', '', ''],
    correct: 0,
    answer: '',
    explanation: '',
    points: 100,
  }
}

const CSV_HEADER = 'Категория;Вопрос;Вариант 1;Вариант 2;Вариант 3;Вариант 4;Номер верного;Пояснение;Баллы'

function splitCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

export function parseQuestionsCsv(text: string): { questions: CustomQuestion[]; errors: number } {
  const lines = text
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  if (lines.length === 0) return { questions: [], errors: 0 }
  const delimiter = lines[0].includes(';') ? ';' : ','
  const first = splitCsvLine(lines[0], delimiter)
  const hasHeader = /категор|вопрос/i.test(first[0] ?? '') || /вопрос/i.test(first[1] ?? '')
  const rows = hasHeader ? lines.slice(1) : lines
  const questions: CustomQuestion[] = []
  let errors = 0

  rows.forEach((line) => {
    const cells = splitCsvLine(line, delimiter)
    const [category, question, o1, o2, o3, o4, correctRaw, explanation, pointsRaw] = cells
    if (!question || !question.trim()) {
      errors += 1
      return
    }
    const options = [o1, o2, o3, o4].map((v) => (v ?? '').trim()).filter(Boolean)
    const correctNum = Number.parseInt((correctRaw ?? '').trim(), 10)
    const correct = Number.isFinite(correctNum) ? Math.max(0, Math.min(options.length - 1, correctNum - 1)) : 0
    const pointsNum = Number.parseInt((pointsRaw ?? '').trim(), 10)
    questions.push({
      id: uid('cq'),
      kind: 'custom',
      source: 'custom',
      category: (category ?? '').trim() || 'Мои задания',
      text: question.trim(),
      options: options.length >= 2 ? options : undefined,
      correct: options.length >= 2 ? correct : 0,
      answer: options.length >= 2 ? options[correct] : (correctRaw ?? '').trim(),
      explanation: (explanation ?? '').trim(),
      points: Number.isFinite(pointsNum) ? Math.max(10, pointsNum) : 100,
    })
  })

  return { questions, errors }
}

export function questionsToCsv(questions: CustomQuestion[]): string {
  const escape = (value: string): string =>
    /[;"\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
  const rows = questions.map((q) => {
    const options = q.options ?? []
    return [
      q.category,
      q.text,
      options[0] ?? q.answer,
      options[1] ?? '',
      options[2] ?? '',
      options[3] ?? '',
      String(q.options && typeof q.correct === 'number' ? q.correct + 1 : ''),
      q.explanation ?? '',
      String(q.points),
    ]
      .map((v) => escape(v))
      .join(';')
  })
  return [CSV_HEADER, ...rows].join('\n')
}

export function downloadFile(name: string, content: string, type = 'text/csv;charset=utf-8'): void {
  const blob = new Blob([`\uFEFF${content}`], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/* ── Незавершённая игра ─────────────────────────────── */

export function loadGameSave(): GameSaveState | null {
  if (typeof window === 'undefined') return null
  const raw = safeParse<GameSaveState | null>(window.localStorage.getItem(SAVE_KEY), null)
  if (!raw || !raw.config || !Array.isArray(raw.teams)) return null
  return raw
}

export function saveGameSave(state: GameSaveState): void {
  try {
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(state))
  } catch {
    /* хранилище переполнено или недоступно */
  }
}

export function clearGameSave(): void {
  try {
    window.localStorage.removeItem(SAVE_KEY)
  } catch {
    /* ignore */
  }
}

export function gameSaveSummary(save: GameSaveState): GameSaveSummary {
  return {
    title: save.config.title,
    subtitle: save.config.subtitle,
    themeId: save.config.themeId,
    savedAt: save.savedAt,
    turn: save.turn,
    maxMoves: save.config.maxMoves,
    teams: save.teams.map((team) => ({
      name: team.name,
      emoji: team.emoji,
      color: team.color,
      score: team.score,
      position: team.position,
    })),
  }
}

/* ── История прохождений ────────────────────────────── */

export function loadHistory(): GameRecord[] {
  if (typeof window === 'undefined') return []
  const records = safeParse<GameRecord[]>(window.localStorage.getItem(HISTORY_KEY), [])
  if (!Array.isArray(records)) return []
  return records.filter((item) => item && item.finishedAt && Array.isArray(item.teams))
}

export function addGameRecord(record: GameRecord): void {
  try {
    const next = [record, ...loadHistory()].slice(0, HISTORY_LIMIT)
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
  } catch {
    /* ignore */
  }
}

export function clearHistory(): void {
  try {
    window.localStorage.removeItem(HISTORY_KEY)
  } catch {
    /* ignore */
  }
}

export function removeGameRecord(id: string): void {
  try {
    const next = loadHistory().filter((item) => item.id !== id)
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next))
  } catch {
    /* ignore */
  }
}
