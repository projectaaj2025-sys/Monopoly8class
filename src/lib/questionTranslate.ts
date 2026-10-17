/**
 * Автоматический перевод заданий прямо в браузере.
 *
 * Цепочка источников:
 *  1. Встроенный переводчик Chrome (Translator API, работает на устройстве).
 *  2. Публичные CORS-совместимые сервисы перевода (Lingva, MyMemory).
 *
 * Результаты кешируются в localStorage, чтобы одно и то же задание
 * не переводилось повторно.
 */

export type TranslateTarget = 'en' | 'kk'

const CACHE_PREFIX = 'fizika-poli:tr:v1'
const memoryCache = new Map<string, string>()

const cacheKey = (target: TranslateTarget, text: string) => `${CACHE_PREFIX}:${target}:${text}`

const readCache = (target: TranslateTarget, text: string): string | null => {
  const key = `${target}\u0000${text}`
  const fromMemory = memoryCache.get(key)
  if (fromMemory) return fromMemory
  try {
    const stored = localStorage.getItem(cacheKey(target, text))
    if (stored) {
      memoryCache.set(key, stored)
      return stored
    }
  } catch {
    /* ignore */
  }
  return null
}

const writeCache = (target: TranslateTarget, text: string, value: string) => {
  memoryCache.set(`${target}\u0000${text}`, value)
  try {
    localStorage.setItem(cacheKey(target, text), value)
  } catch {
    /* переполнение хранилища игнорируем */
  }
}

const withTimeout = async <T,>(promise: Promise<T>, ms: number): Promise<T> => {
  let timer: number | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = window.setTimeout(() => reject(new Error('timeout')), ms)
  })
  try {
    return await Promise.race([promise, timeout])
  } finally {
    if (timer) window.clearTimeout(timer)
  }
}

/* ─────────────── 1. Встроенный переводчик Chrome ─────────────── */

type ChromeTranslator = {
  translate: (text: string) => Promise<string>
  destroy?: () => void
}

type ChromeTranslatorApi = {
  availability?: (options: { sourceLanguage: string; targetLanguage: string }) => Promise<string>
  create: (options: { sourceLanguage: string; targetLanguage: string }) => Promise<ChromeTranslator>
}

const chromeTranslators = new Map<TranslateTarget, ChromeTranslator>()
const chromeProbed = new Set<TranslateTarget>()

const getChromeTranslator = async (target: TranslateTarget): Promise<ChromeTranslator | null> => {
  const api = (globalThis as { Translator?: ChromeTranslatorApi }).Translator
  if (!api) return null
  const existing = chromeTranslators.get(target)
  if (existing) return existing
  if (chromeProbed.has(target)) return null
  chromeProbed.add(target)
  try {
    if (api.availability) {
      // Проверка не должна задерживать интерфейс: если модель не готова,
      // спокойно переходим к внешнему переводчику.
      const state = await withTimeout(
        api.availability({ sourceLanguage: 'ru', targetLanguage: target }),
        1200,
      )
      if (state !== 'available') return null
    }
    const translator = await withTimeout(api.create({ sourceLanguage: 'ru', targetLanguage: target }), 4000)
    chromeTranslators.set(target, translator)
    return translator
  } catch {
    return null
  }
}

/* ─────────────── 2. Публичные сервисы ─────────────── */

const splitChunks = (text: string, limit: number): string[] => {
  if (text.length <= limit) return [text]
  const parts: string[] = []
  let rest = text
  while (rest.length > limit) {
    const cut = Math.max(rest.lastIndexOf('. ', limit), rest.lastIndexOf('? ', limit), rest.lastIndexOf('! ', limit))
    const index = cut > limit * 0.4 ? cut + 1 : limit
    parts.push(rest.slice(0, index).trim())
    rest = rest.slice(index).trim()
  }
  if (rest) parts.push(rest)
  return parts
}

const translateLingva = async (text: string, target: TranslateTarget): Promise<string> => {
  const hosts = ['https://lingva.ml', 'https://lingva.garudalinux.org']
  for (const host of hosts) {
    try {
      const response = await withTimeout(
        fetch(`${host}/api/v1/ru/${target}/${encodeURIComponent(text)}`),
        8000,
      )
      if (!response.ok) continue
      const data = (await response.json()) as { translation?: string }
      if (data.translation) return data.translation
    } catch {
      continue
    }
  }
  throw new Error('lingva failed')
}

const translateMyMemory = async (text: string, target: TranslateTarget): Promise<string> => {
  const langpair = `ru|${target === 'kk' ? 'kk' : 'en'}`
  const chunks = splitChunks(text, 450)
  const translated: string[] = []
  for (const chunk of chunks) {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=${langpair}`
    const response = await withTimeout(fetch(url), 8000)
    if (!response.ok) throw new Error('mymemory failed')
    const data = (await response.json()) as { responseData?: { translatedText?: string }; responseStatus?: number }
    const value = data.responseData?.translatedText
    if (!value) throw new Error('mymemory empty')
    translated.push(value)
  }
  return translated.join(' ')
}

const translateRemote = async (text: string, target: TranslateTarget): Promise<string> => {
  try {
    return await translateLingva(text, target)
  } catch {
    return translateMyMemory(text, target)
  }
}

/* ─────────────── Публичное API ─────────────── */

export const shouldTranslate = (text: string): boolean => /[А-Яа-яЁё]/.test(text)

export async function translateText(text: string, target: TranslateTarget): Promise<string> {
  const trimmed = text.trim()
  if (!trimmed) return text
  if (!shouldTranslate(trimmed)) return text
  const cached = readCache(target, trimmed)
  if (cached) return cached
  const chromeTranslator = await getChromeTranslator(target)
  if (chromeTranslator) {
    try {
      const value = await withTimeout(chromeTranslator.translate(trimmed), 12000)
      if (value) {
        writeCache(target, trimmed, value)
        return value
      }
    } catch {
      /* падаем на внешний сервис */
    }
  }
  const remote = await translateRemote(trimmed, target)
  writeCache(target, trimmed, remote)
  return remote
}

/** Переводит набор строк, сохраняя порядок и пропуская пустые. */
export async function translateList(texts: string[], target: TranslateTarget): Promise<string[]> {
  const result: string[] = []
  for (const text of texts) {
    try {
      result.push(await translateText(text, target))
    } catch {
      result.push(text)
    }
  }
  return result
}
