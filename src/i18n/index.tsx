import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import en from './locales/en.json'
import kk from './locales/kk.json'

export type Locale = 'ru' | 'kk' | 'en'

export const LOCALE_OPTIONS: { id: Locale; label: string; short: string }[] = [
  { id: 'ru', label: 'Русский', short: 'RU' },
  { id: 'kk', label: 'Қазақша', short: 'KZ' },
  { id: 'en', label: 'English', short: 'EN' },
]

const STORAGE_KEY = 'fizika-poli:locale'
const DICTS: Record<Exclude<Locale, 'ru'>, Record<string, string>> = { kk, en }

let activeLocale: Locale = 'ru'

export const getLocale = (): Locale => activeLocale

const readSavedLocale = (): Locale => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'ru' || saved === 'kk' || saved === 'en') return saved
  } catch {
    /* ignore */
  }
  return 'ru'
}

export const applyLocale = (locale: Locale) => {
  activeLocale = locale
  try {
    localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    /* ignore */
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale
  }
}

/** Перевод интерфейсной строки. Ключ — русский текст. */
export function t(key: string, vars?: Record<string, string | number>): string {
  if (!key) return ''
  const dict = activeLocale === 'ru' ? null : DICTS[activeLocale]
  let value = dict?.[key] ?? key
  if (vars) {
    value = value.replace(/\{(\w+)\}/g, (match, name: string) =>
      vars[name] === undefined ? match : String(vars[name]),
    )
  }
  return value
}

export const hasTranslation = (key: string): boolean =>
  activeLocale !== 'ru' && Boolean(DICTS[activeLocale][key])

/** Формы множественного числа для локали. */
const PLURAL_FORMS: Record<
  string,
  { en: [string, string]; kk: string }
> = {
  'тема|темы|тем': { en: ['topic', 'topics'], kk: 'тақырып' },
  'вопрос|вопроса|вопросов': { en: ['question', 'questions'], kk: 'сұрақ' },
  'задание|задания|заданий': { en: ['task', 'tasks'], kk: 'тапсырма' },
  'монополия|монополии|монополий': { en: ['board', 'boards'], kk: 'монополия' },
  'категория|категории|категорий': { en: ['category', 'categories'], kk: 'санат' },
  'круг|круга|кругов': { en: ['round', 'rounds'], kk: 'айналым' },
  'клетка|клетки|клеток': { en: ['cell', 'cells'], kk: 'ұяшық' },
  'клетки|клеток|клеток': { en: ['cell', 'cells'], kk: 'ұяшық' },
  'класс|класса|классов': { en: ['class', 'classes'], kk: 'сынып' },
  'место|места|мест': { en: ['place', 'places'], kk: 'орын' },
  'команда|команды|команд': { en: ['team', 'teams'], kk: 'команда' },
  'ход|хода|ходов': { en: ['move', 'moves'], kk: 'жүріс' },
}

/** Русские формы — для «сырых» строк, которые локализуются при отрисовке. */
export function pluralRu(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

export function plural(n: number, one: string, few: string, many: string): string {
  if (activeLocale !== 'ru') {
    const forms = PLURAL_FORMS[`${one}|${few}|${many}`]
    if (forms) {
      if (activeLocale === 'en') {
        if (n === 1) return forms.en[0]
        return forms.en[1]
      }
      return forms.kk
    }
  }
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few
  return many
}

/** Формы глагола для одной/нескольких команд. */
const VERB_FORMS: Record<string, { en: string; kk: string }> = {
  бросают: { en: 'roll', kk: 'тастайды' },
  бросает: { en: 'rolls', kk: 'тастайды' },
  запустили: { en: 'launched', kk: 'ұшырды' },
  запустила: { en: 'launched', kk: 'ұшырды' },
  остановились: { en: 'stopped', kk: 'тоқтады' },
  остановилась: { en: 'stopped', kk: 'тоқтады' },
  получают: { en: 'get', kk: 'алады' },
  получает: { en: 'gets', kk: 'алады' },
  попали: { en: 'landed on', kk: 'түсті' },
  попала: { en: 'landed on', kk: 'түсті' },
  прошли: { en: 'completed', kk: 'өтті' },
  прошла: { en: 'completed', kk: 'өтті' },
}

export function verb(pluralForm: string, singleForm: string): string {
  const forms = VERB_FORMS[pluralForm]
  if (!forms || activeLocale === 'ru') return pluralForm
  return activeLocale === 'en' ? forms.en : forms.kk
}

/** Числовые фразы вида «12 тем» внутри составных заголовков. */
const COUNT_NOUNS: Record<string, [string, string, string]> = {
  тем: ['тема', 'темы', 'тем'],
  тема: ['тема', 'темы', 'тем'],
  темы: ['тема', 'темы', 'тем'],
  вопросов: ['вопрос', 'вопроса', 'вопросов'],
  вопроса: ['вопрос', 'вопроса', 'вопросов'],
  заданий: ['задание', 'задания', 'заданий'],
  задания: ['задание', 'задания', 'заданий'],
  клеток: ['клетка', 'клетки', 'клеток'],
  ходов: ['ход', 'хода', 'ходов'],
  кругов: ['круг', 'круга', 'кругов'],
  команд: ['команда', 'команды', 'команд'],
  классов: ['класс', 'класса', 'классов'],
}

const localizeCountPhrase = (part: string): string => {
  const match = part.match(/^(\d+)\s+(?:[А-Яа-яЁё]+\s+)?([А-Яа-яЁё]+)$/)
  if (!match) return t(part)
  const n = Number(match[1])
  const noun = COUNT_NOUNS[match[2].toLowerCase()]
  if (!noun) return t(part)
  return `${n} ${plural(n, ...noun)}`
}

/** Переводит составной заголовок вида «8 класс · I четверть · 12 тем». */
export function localizeComposed(value: string): string {
  if (!value) return value
  return value
    .split(' · ')
    .map((part) => {
      const trimmed = part.trim()
      if (!trimmed) return part
      if (/^\d+\s+(?:[А-Яа-яЁё]+\s+)?[А-Яа-яЁё]+$/.test(trimmed)) return localizeCountPhrase(trimmed)
      const range = trimmed.match(/^(\d+)–(\d+) классы$/)
      if (range) {
        if (activeLocale === 'en') return `${range[1]}–${range[2]} grades`
        if (activeLocale === 'kk') return `${range[1]}–${range[2]} сынып`
      }
      return t(trimmed)
    })
    .join(' · ')
}

interface LocaleContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
}

const LocaleContext = createContext<LocaleContextValue>({ locale: 'ru', setLocale: () => {} })

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = readSavedLocale()
    activeLocale = saved
    return saved
  })

  useEffect(() => {
    applyLocale(locale)
  }, [locale])

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale: (next) => {
        applyLocale(next)
        setLocaleState(next)
      },
    }),
    [locale],
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export const useLocale = (): LocaleContextValue => useContext(LocaleContext)
