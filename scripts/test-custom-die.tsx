import { helpers } from './harness.mjs'
const log = (...a: unknown[]) => console.log('[test]', ...a)
const { sleep } = helpers

await helpers.click(helpers.buttonByText('Мои монополии', { substring: true })!)
await sleep(60)
const playBtn = [...document.querySelectorAll('button')].find((b) => b.textContent?.trim() === 'Играть')
await helpers.click(playBtn!)
await sleep(60)
const die = document.querySelector('.die') as HTMLElement
log('custom game die clip-path:', die?.style.getPropertyValue('--die-clip')?.slice(0, 40))
log('custom game die radius:', die?.style.getPropertyValue('--die-radius'))
log('custom game die face:', die?.style.getPropertyValue('--die-face')?.slice(0, 40))
process.exit(0)
