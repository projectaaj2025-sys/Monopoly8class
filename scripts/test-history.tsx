// Проверка: история прохождений.
import { helpers } from './harness.mjs'

const log = (...args: unknown[]) => console.log('[test]', ...args)
const { sleep } = helpers

const playAndFinish = async () => {
  await helpers.click(document.querySelector('.start-btn')!)
  await sleep(60)
  await helpers.click(helpers.buttonByText('Завершить игру')!)
  await sleep(40)
  await helpers.click(helpers.buttonByText('Показать итоги')!)
  await sleep(700)
  await helpers.click(helpers.buttonByText('В меню')!)
  await sleep(60)
}

// Сыграли две игры
await playAndFinish()
await playAndFinish()

// Открыли историю
await helpers.click(helpers.buttonByText('История')!)
await sleep(80)
const cards = document.querySelectorAll('.history-card')
log('history cards:', cards.length, '(ожидаем 2)')
const first = cards[0]
log('first record title:', first?.querySelector('.history-card-main b')?.textContent)
log('first record winner:', first?.querySelector('.history-winner')?.textContent?.trim())

// Раскрыли карточку — должна быть таблица команд
await helpers.click(first!.querySelector('.history-card-head')!)
await sleep(60)
log('expanded body:', Boolean(first?.querySelector('.history-card-body')))
log('team rows:', first?.querySelectorAll('.history-team').length)
log('meta text:', first?.querySelector('.history-meta')?.textContent?.trim())

// Удалили первую запись
const dropBtn = [...document.querySelectorAll('button')].find((b) => b.textContent?.includes('удалить запись'))
await helpers.click(dropBtn!)
await sleep(60)
log('cards after delete:', document.querySelectorAll('.history-card').length, '(ожидаем 1)')

// Очистили историю
await helpers.click(helpers.buttonByText('Очистить историю')!)
await sleep(40)
await helpers.click(helpers.buttonByText('Очистить')!)
await sleep(60)
log('empty state:', Boolean(document.querySelector('.history-page .empty-state')), '(ожидаем true)')

process.exit(0)
