import type { Question, QuestionKind } from '../types'
import { TOPIC_BY_ID, TOPIC_ENTRIES } from './curriculum'
import { APPLIED_QUESTIONS } from './programs/applied'
import type { SeedQuestionKind } from './programs/shared'

export const KIND_POINTS: Record<QuestionKind, number> = {
  theory: 100,
  formula: 150,
  problem: 200,
  practice: 250,
  custom: 100,
}

/**
 * Банк заданий собирается из тем КТП. У каждой темы — вопросы разных типов:
 * теория, формула, расчётная задача и практическое применение.
 * Именно поэтому на поле находятся клетки «Формула», «Задача» и «Практика».
 */
/**
 * Детерминированно перемешиваем варианты ответа: в исходниках верный вариант
 * почти всегда записан первым, а на экране ответы не должны стоять на месте A.
 * Один и тот же вопрос всегда перемешивается одинаково (сид из id).
 */
const hashSeed = (value: string): number => {
  let h = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

const mulberry32 = (seed: number): (() => number) => {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let r = Math.imul(a ^ (a >>> 15), 1 | a)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

const shuffleOptions = (
  options: string[],
  correct: number,
  seed: string,
): { options: string[]; correct: number } => {
  const random = mulberry32(hashSeed(seed))
  const shuffled = options.map((text, index) => ({ text, index }))
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return {
    options: shuffled.map((item) => item.text),
    correct: shuffled.findIndex((item) => item.index === correct),
  }
}

export const BASE_QUESTIONS: Question[] = TOPIC_ENTRIES.flatMap(({ topic, questions }) =>
  [...questions, ...(APPLIED_QUESTIONS[topic.id] ?? [])].map((seed, index) => {
    const [kind, text, options, correct, explanation] = seed
    const normalizedKind: QuestionKind = kind as SeedQuestionKind
    const id = `${topic.id}-q${index + 1}`
    const shuffled = shuffleOptions(options, correct, id)
    return {
      id,
      topicId: topic.id,
      grade: topic.grade,
      kind: normalizedKind,
      text,
      options: shuffled.options,
      correct: shuffled.correct,
      answer: shuffled.options[shuffled.correct] ?? '',
      explanation,
      points: KIND_POINTS[normalizedKind],
      source: 'base',
    }
  }),
)

export const questionCountByKind = (): Record<string, number> =>
  BASE_QUESTIONS.reduce<Record<string, number>>((acc, question) => {
    acc[question.kind] = (acc[question.kind] ?? 0) + 1
    return acc
  }, {})

/** Проверка целостности банка: используется в тестах и при сборке. */
export const validateQuestionBank = (): string[] => {
  const problems: string[] = []
  BASE_QUESTIONS.forEach((question) => {
    if (!question.topicId || !TOPIC_BY_ID[question.topicId]) {
      problems.push(`Неизвестная тема у вопроса ${question.id}`)
    }
    if (!question.options || question.options.length < 2) {
      problems.push(`Мало вариантов у вопроса ${question.id}`)
    }
    if (typeof question.correct !== 'number' || !question.options?.[question.correct]) {
      problems.push(`Неверный номер ответа у вопроса ${question.id}`)
    }
  })
  TOPIC_ENTRIES.forEach(({ topic }) => {
    const questions = BASE_QUESTIONS.filter((question) => question.topicId === topic.id)
    if (questions.length === 0) problems.push(`Нет вопросов у темы ${topic.id}`)
    if (!questions.some((question) => question.kind === 'practice')) {
      problems.push(`Нет практического задания у темы ${topic.id}`)
    }
  })
  return problems
}
