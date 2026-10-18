// Headless harness: renders the app in jsdom and lets us click through flows.
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost:5173/',
  pretendToBeVisual: true,
})

const { window } = dom

// Browser globals the app expects
globalThis.window = window
globalThis.document = window.document

globalThis.localStorage = window.localStorage
globalThis.FileReader = window.FileReader
globalThis.File = window.File
globalThis.Event = window.Event
globalThis.KeyboardEvent = window.KeyboardEvent
globalThis.MouseEvent = window.MouseEvent
globalThis.CustomEvent = window.CustomEvent
globalThis.getComputedStyle = window.getComputedStyle
globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 16)
globalThis.cancelAnimationFrame = (id) => clearTimeout(id)
window.scrollTo = () => {}
window.matchMedia = window.matchMedia || ((q) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }))
window.AudioContext = class {
  constructor() { this.state = 'running'; this.currentTime = 0; this.destination = {} }
  resume() { return Promise.resolve() }
  createOscillator() { const o = { type: '', frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect: () => o, start() {}, stop() {} }; return o }
  createGain() { const g = { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect: () => g }; return g }
}
window.HTMLElement.prototype.scrollIntoView = window.HTMLElement.prototype.scrollIntoView || function () {}

// Node 22 defines navigator as a getter-only global; redefine it with jsdom's.
Object.defineProperty(globalThis, 'navigator', { value: window.navigator, configurable: true, writable: true })

const React = (await import('react')).default
const { createRoot } = await import('react-dom/client')
const { act } = await import('react')
globalThis.IS_REACT_ACT_ENVIRONMENT = true

const { default: App } = await import('../src/App.tsx')

const root = createRoot(document.getElementById('root'))
await act(async () => { root.render(React.createElement(App)) })

const helpers = {
  act,
  // Find a button by its visible text (exact or substring)
  buttonByText(text, { substring = false } = {}) {
    const buttons = [...document.querySelectorAll('button')]
    return buttons.find((b) => {
      const label = (b.textContent || '').replace(/\s+/g, ' ').trim()
      return substring ? label.includes(text) : label === text
    })
  },
  click(el) {
    if (!el) throw new Error('click: element not found')
    return act(async () => {
      el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }))
      await new Promise((r) => setTimeout(r, 0))
    })
  },
  text() {
    return document.body.textContent.replace(/\s+/g, ' ').trim()
  },
  // Fast-forward timers is not possible with real setTimeout; tests use small waits.
  sleep(ms) {
    return new Promise((r) => setTimeout(r, ms))
  },
}

const doc = window.document
export { root, helpers, window, doc as document }
