// Проверка отображения: все классы, темы, экраны.
import { helpers } from './harness.mjs'

const log = (...args: unknown[]) => console.log('[test]', ...args)
const { sleep } = helpers

const errors: string[] = []
window.addEventListener('error', (e) => errors.push(e.message))

const pickGrade = async (grade: string) => {
  const card = [...document.querySelectorAll('.grade-card')].find((el) => el.textContent?.includes(grade))
  if (!card) { log('MISSING grade card', grade); return }
  if (!card.className.includes('is-selected')) { await helpers.click(card); await sleep(20) }
  // снять лишние классы (сначала добавили нужный — теперь можно снимать)
  for (const sel of [...document.querySelectorAll('.grade-card.is-selected')]) {
    if (sel !== card) { await helpers.click(sel); await sleep(20) }
  }
}

// Собираем все классы по очереди
for (const grade of ['7 класс', '8 класс', '9 класс', '10 класс', '11 класс']) {
  await pickGrade(grade)
  await sleep(20)
  await helpers.click(document.querySelector('.start-btn')!)
  await sleep(60)
  const tiles = document.querySelectorAll('.tile').length
  const patterns = document.querySelectorAll('.board-pattern-svg').length
  const die = document.querySelector('.die') as HTMLElement
  const dieRadius = die?.style.getPropertyValue('--die-radius')
  const boardFrame = document.querySelector('.board-frame') as HTMLElement
  const accent = boardFrame?.style.getPropertyValue('--accent')
  const eyebrow = document.querySelector('.game-heading-eyebrow')?.textContent?.trim()
  log(`${grade}: tiles=${tiles} patterns=${patterns} dieRadius=${dieRadius} accent=${accent} | ${eyebrow}`)
  if (tiles !== 28) errors.push(`${grade}: tiles ${tiles}`)
  await helpers.click(document.querySelector('.icon-btn[aria-label="Выйти в меню"]')!)
  await sleep(40)
}

// Итоговое повторение: 7+8+9 одновременно, весь год → круглый золотой кубик
log('review preset (7–9 класса, весь год)')
// сначала ровно один класс (8), потом добавляем 7 и 9
await pickGrade('8 класс')
for (const g of ['7 класс', '9 класс']) {
  const card = [...document.querySelectorAll('.grade-card')].find((el) => el.textContent?.includes(g))
  if (card && !card.className.includes('is-selected')) { await helpers.click(card); await sleep(20) }
}
await helpers.click(helpers.buttonByText('Вся программа', { substring: true })!)
await sleep(30)
await helpers.click(document.querySelector('.start-btn')!)
await sleep(60)
const reviewDie = document.querySelector('.die') as HTMLElement
log('review game:', document.querySelectorAll('.tile').length, 'tiles; die radius:', reviewDie?.style.getPropertyValue('--die-radius'), '(ожидаем 50% — круглый)')
await helpers.click(document.querySelector('.icon-btn[aria-label="Выйти в меню"]')!)
await sleep(40)

// Формат «свои темы» — кубик-сквircle
log('topics format')
await pickGrade('8 класс')
await helpers.click(helpers.buttonByText('Свои темы')!)
await sleep(30)
const topicChip = document.querySelector('.topic-chip')
if (topicChip) {
  await helpers.click(topicChip)
  await sleep(20)
  await helpers.click(document.querySelector('.start-btn')!)
  await sleep(60)
  const r = (document.querySelector('.die') as HTMLElement)?.style.getPropertyValue('--die-radius')
  log('topics game die radius:', r, '(ожидаем 30% — сквircle)')
  await helpers.click(document.querySelector('.icon-btn[aria-label="Выйти в меню"]')!)
  await sleep(40)
} else {
  errors.push('no topic chips found')
}

// Светлая тема
log('light theme')
const themeBtn = document.querySelector('.theme-toggle') as HTMLButtonElement
await helpers.click(themeBtn)
await sleep(40)
log('html data-theme:', document.documentElement.dataset.theme)
await helpers.click(themeBtn)
await sleep(40)

// Библиотека
log('library')
await helpers.click(helpers.buttonByText('Мои монополии', { substring: true })!)
await sleep(60)
log('board cards:', document.querySelectorAll('.board-card').length, 'minis:', document.querySelectorAll('.board-card-mini').length)

// Конструктор
log('builder')
await helpers.click(helpers.buttonByText('Создать монополию', { substring: true })!)
await sleep(60)
log('builder page:', Boolean(document.querySelector('.builder-page')), 'mini tiles:', document.querySelectorAll('.builder-mini > span').length)

log('js errors:', errors.length ? errors : 'none')
process.exit(errors.length ? 1 : 0)
