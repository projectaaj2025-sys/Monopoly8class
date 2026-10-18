// Проверка: автосохранение и возврат к незавершённой игре.
import { helpers } from './harness.mjs'

const log = (...args: unknown[]) => console.log('[test]', ...args)
const { sleep } = helpers

// 1. Начали игру
await helpers.click(document.querySelector('.start-btn')!)
await sleep(60)
log('game started')

// 2. Сделали ход: бросок + ответ на вопрос
await helpers.click(helpers.buttonByText('Бросить кубик', { substring: true })!)
await sleep(1400) // ход фишки + открытие вопроса
const modal = document.querySelector('.question-modal')
log('question modal:', Boolean(modal))
if (modal) {
  const opt = modal.querySelector('.option') as HTMLButtonElement
  await helpers.click(opt)
  await sleep(500)
}
// ждём перехода хода
await sleep(600)

const scoreBefore = document.querySelector('.team-card.is-active .team-score')?.textContent?.trim()
log('score/state after move:', scoreBefore)

// 3. Вышли из игры (иконка «выйти в меню»)
await helpers.click(document.querySelector('.icon-btn[aria-label="Выйти в меню"]')!)
await sleep(80)

// 4. На экране настройки — баннер продолжения
const banner = document.querySelector('.resume-banner')
log('resume banner shown:', Boolean(banner))
log('banner title:', banner?.querySelector('h2')?.textContent)
log('banner teams:', banner?.querySelectorAll('.resume-team').length)

// 5. Продолжили игру
await helpers.click(helpers.buttonByText('Продолжить игру')!)
await sleep(80)
log('back in game:', Boolean(document.querySelector('.game-screen')))
const restoredScore = document.querySelector('.team-card .team-score')?.textContent?.trim()
log('restored score:', restoredScore)
const die = document.querySelector('.die')
log('die restored:', Boolean(die))

// 6. Завершили игру — сохранение должно сняться
await helpers.click(helpers.buttonByText('Завершить игру')!)
await sleep(40)
await helpers.click(helpers.buttonByText('Показать итоги')!)
await sleep(700)
log('results shown:', Boolean(document.querySelector('.results-page')))
await helpers.click(helpers.buttonByText('Изменить настройки')!)
await sleep(80)
log('banner after finish (ожидаем false):', Boolean(document.querySelector('.resume-banner')))

process.exit(0)
