export type ThemeMode = 'dark' | 'light'

const STORAGE_KEY = 'fizika-poli:theme'

export const getInitialTheme = (): ThemeMode => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
    if (window.matchMedia?.('(prefers-color-scheme: light)').matches) return 'light'
  } catch {
    /* localStorage may be unavailable */
  }
  return 'dark'
}

export const applyTheme = (mode: ThemeMode) => {
  document.documentElement.dataset.theme = mode
  try {
    localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    /* ignore */
  }
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', mode === 'light' ? '#eef2f9' : '#050a15')
}
