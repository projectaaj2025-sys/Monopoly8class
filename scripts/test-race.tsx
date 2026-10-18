// Гонка: игра завершается, но отложенные таймеры хода ещё живут.
// До фикса они переводили фазу обратно из итогов в игру.
import { helpers } from './harness.mjs'

const log = (...args: unknown[]) => console.log('[test]', ...args)
const { sleep } = helpers

await helpers.click(document.querySelector('.start-btn')!)
await sleep(60)
log('game started')

// Бросаем кубик и сразу завершаем игру, пока фишка ещё идёт
await helpers.click(helpers.buttonByText('Бросить кубик', { substring: true })!)
await sleep(30)
log('rolling...')

await helpers.click(helpers.buttonByText('Завершить игру')!)
await sleep(30)
await helpers.click(helpers.buttonByText('Показать итоги')!)
await sleep(300)
log('results shown:', Boolean(document.querySelector('.results-page')))

// Ждём дольше, чем длится весь отложенный ход (6 шагов * 140 + 220 ≈ 1.1 с)
await sleep(1800)

const resultsStill = Boolean(document.querySelector('.results-page'))
const gameReturned = Boolean(document.querySelector('.game-screen'))
const questionModal = Boolean(document.querySelector('.question-modal'))
const eventModal = Boolean(document.querySelector('.event-modal'))
log('after 1.8s -> results:', resultsStill, 'game returned:', gameReturned, 'question:', questionModal, 'event:', eventModal)

if (resultsStill && !gameReturned && !questionModal && !eventModal) {
  log('PASS: игра не возвращается из итогов')
} else {
  log('FAIL: экран вернулся в игру после завершения')
}
process.exit(0)
