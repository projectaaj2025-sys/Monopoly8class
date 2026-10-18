// Проверяем навигацию: игра -> итоги -> настройки -> настройки экран
import { helpers } from './harness.mjs'

const log = (...args: unknown[]) => console.log('[test]', ...args)
const { sleep } = helpers

const where = () => ({
  setup: Boolean(document.querySelector('.setup-page')),
  game: Boolean(document.querySelector('.game-screen')),
  library: Boolean(document.querySelector('.library-page')),
  results: Boolean(document.querySelector('.results-page')),
})

const finishCurrentGame = async () => {
  await helpers.click(helpers.buttonByText('Завершить игру')!)
  await sleep(40)
  await helpers.click(helpers.buttonByText('Показать итоги')!)
  await sleep(700)
}

// ── 1. Обычная игра по программе ─────────────────────────
log('1) curriculum game')
await helpers.click(document.querySelector('.start-btn')!)
await sleep(60)
log('  in game:', where().game, 'tiles:', document.querySelectorAll('.tile').length)
await finishCurrentGame()
log('  results:', where().results)
await helpers.click(helpers.buttonByText('Изменить настройки')!)
await sleep(60)
log('  after settings -> setup:', where().setup, 'game:', where().game)

// ── 2. Авторская монополия из библиотеки ─────────────────
log('2) custom board from library')
await helpers.click(helpers.buttonByText('Мои монополии', { substring: true })!)
await sleep(60)
const playBtn = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Играть')
log('  play button found:', Boolean(playBtn))
await helpers.click(playBtn!)
await sleep(60)
log('  in game:', where().game)
await finishCurrentGame()
log('  results:', where().results)
await helpers.click(helpers.buttonByText('Изменить настройки')!)
await sleep(60)
log('  after settings -> setup (не библиотека):', where().setup, 'library:', where().library)

// ── 3. Снова обычная игра: «В меню» должна вести в настройки ──
log('3) curriculum game after custom')
await helpers.click(document.querySelector('.start-btn')!)
await sleep(60)
log('  in game:', where().game)
await finishCurrentGame()
await helpers.click(helpers.buttonByText('В меню')!)
await sleep(60)
log('  after «В меню» -> setup:', where().setup, 'library:', where().library)

// ── 4. Кубик: дизайн зависит от темы и формата ───────────
log('4) die design')
await helpers.click(document.querySelector('.start-btn')!)
await sleep(60)
const die = document.querySelector('.die') as HTMLElement
log('  die vars:', {
  face: die?.style.getPropertyValue('--die-face').slice(0, 30),
  radius: die?.style.getPropertyValue('--die-radius'),
})
const rollBtn = helpers.buttonByText('Бросить кубик', { substring: true })
log('  roll btn enabled:', rollBtn ? !(rollBtn as HTMLButtonElement).disabled : 'not found')
await helpers.click(rollBtn!)
await sleep(200)
log('  die rolling class:', document.querySelector('.die')?.className.includes('is-rolling'))
await sleep(1200) // ход + вопрос
const modalOpen = Boolean(document.querySelector('.question-modal'))
log('  question modal opened:', modalOpen)

// Ответим на вопрос (первый вариант), затем завершим игру
if (modalOpen) {
  const opt = document.querySelector('.question-modal .option') as HTMLButtonElement
  await helpers.click(opt)
  await sleep(400)
}
await finishCurrentGame()
log('  results again:', where().results)

process.exit(0)
