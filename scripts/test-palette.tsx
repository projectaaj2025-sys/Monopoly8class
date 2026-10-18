// Проверка: спокойная палитра поля.
import { helpers } from './harness.mjs'
const log = (...a: unknown[]) => console.log('[test]', ...a)
const { sleep } = helpers

await helpers.click(document.querySelector('.start-btn')!)
await sleep(60)
const tiles = [...document.querySelectorAll('.tile')]
log('tiles:', tiles.length)
const kinds = new Map<string, string>()
for (const t of tiles) {
  const kind = [...t.classList].find((c) => c.startsWith('tile--'))
  const bg = (t as HTMLElement).style.background || '(none)'
  if (kind && !kinds.has(kind)) kinds.set(kind, bg)
}
for (const [kind, bg] of kinds) log(`${kind}: ${bg.slice(0, 95)}…`)
process.exit(0)
