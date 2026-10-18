// Прогон всех headless-проверок (jsdom + esbuild).
// npm run check
import { build } from 'esbuild'
import { spawnSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'

const CHECKS = [
  'scripts/test-navigation.tsx',
  'scripts/test-race.tsx',
  'scripts/test-display.tsx',
  'scripts/test-custom-die.tsx',
  'scripts/test-resume.tsx',
  'scripts/test-history.tsx',
]

const outDir = join(process.cwd(), 'scripts', '.checks')
mkdirSync(outDir, { recursive: true })

let failed = 0

for (const entry of CHECKS) {
  const outfile = join(outDir, entry.replace(/[/.]/g, '_') + '.mjs')
  await build({
    entryPoints: [entry],
    bundle: true,
    format: 'esm',
    platform: 'node',
    jsx: 'automatic',
    outfile,
    loader: { '.css': 'empty', '.jpg': 'dataurl', '.woff2': 'dataurl' },
    external: ['jsdom'],
    define: { 'import.meta.env.BASE_URL': "'/'", 'import.meta.env.DEV': 'false' },
    logLevel: 'silent',
  })
  console.log(`\n═══ ${entry} ═══`)
  const res = spawnSync(process.execPath, [outfile], {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
  })
  const out = res.stdout?.toString() ?? ''
  const err = res.stderr?.toString() ?? ''
  // Предупреждения act() — шум тестового окружения, не ошибки приложения
  const meaningful = out.split('\n').filter((l) => l.includes('[test]')).join('\n')
  if (meaningful) console.log(meaningful)
  const realErr = err.split('\n').filter((l) => l && !l.includes('act(') && !l.includes('fire events') && !l.includes('assert on') && !l.includes('ensures') && !l.includes('reactjs.org') && !l.trim().startsWith('at ') && l.trim() !== '});' && l.trim() !== '' && !l.includes('Warning: An update'))
  if (realErr.length) console.log(realErr.join('\n'))
  if (res.status !== 0) {
    failed += 1
    console.log(`✗ ${entry} — exit code ${res.status}`)
  }
}

console.log(failed === 0 ? '\nВсе проверки пройдены ✓' : `\nПроверки с ошибками: ${failed}`)
process.exit(failed === 0 ? 0 : 1)
