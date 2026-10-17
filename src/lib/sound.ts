const SOUND_KEY = 'fizika-poli.sound.v1'

let enabled = true
try {
  enabled = window.localStorage.getItem(SOUND_KEY) !== '0'
} catch {
  enabled = true
}

let ctx: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

export function isSoundEnabled(): boolean {
  return enabled
}

export function setSoundEnabled(value: boolean): void {
  enabled = value
  try {
    window.localStorage.setItem(SOUND_KEY, value ? '1' : '0')
  } catch {
    /* ignore */
  }
}

interface ToneOptions {
  freq: number
  duration?: number
  type?: OscillatorType
  gain?: number
  delay?: number
  slideTo?: number
}

function tone({ freq, duration = 0.12, type = 'sine', gain = 0.06, delay = 0, slideTo }: ToneOptions): void {
  if (!enabled) return
  const audio = getContext()
  if (!audio) return
  const start = audio.currentTime + delay
  const osc = audio.createOscillator()
  const envelope = audio.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), start + duration)
  envelope.gain.setValueAtTime(0.0001, start)
  envelope.gain.exponentialRampToValueAtTime(gain, start + 0.012)
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.connect(envelope)
  envelope.connect(audio.destination)
  osc.start(start)
  osc.stop(start + duration + 0.03)
}

export const sfx = {
  tap: () => tone({ freq: 440, duration: 0.05, type: 'triangle', gain: 0.025 }),
  open: () => {
    tone({ freq: 392, duration: 0.1, type: 'sine', gain: 0.04 })
    tone({ freq: 587, duration: 0.14, type: 'sine', gain: 0.035, delay: 0.06 })
  },
  roll: () => {
    for (let i = 0; i < 5; i += 1) {
      tone({ freq: 180 + Math.random() * 160, duration: 0.045, type: 'square', gain: 0.02, delay: i * 0.06 })
    }
  },
  step: () => tone({ freq: 660, duration: 0.04, type: 'triangle', gain: 0.018 }),
  correct: () => {
    tone({ freq: 523, duration: 0.12, type: 'sine', gain: 0.055 })
    tone({ freq: 659, duration: 0.12, type: 'sine', gain: 0.055, delay: 0.1 })
    tone({ freq: 784, duration: 0.22, type: 'sine', gain: 0.06, delay: 0.2 })
  },
  wrong: () => {
    tone({ freq: 240, duration: 0.16, type: 'sawtooth', gain: 0.03 })
    tone({ freq: 165, duration: 0.24, type: 'sawtooth', gain: 0.03, delay: 0.12 })
  },
  bonus: () => {
    tone({ freq: 784, duration: 0.09, type: 'triangle', gain: 0.05 })
    tone({ freq: 988, duration: 0.09, type: 'triangle', gain: 0.05, delay: 0.08 })
    tone({ freq: 1175, duration: 0.2, type: 'triangle', gain: 0.05, delay: 0.16 })
  },
  win: () => {
    const notes = [523, 659, 784, 1047, 1319]
    notes.forEach((freq, i) =>
      tone({ freq, duration: i === notes.length - 1 ? 0.5 : 0.18, type: 'triangle', gain: 0.055, delay: i * 0.14 }),
    )
  },
  tick: () => tone({ freq: 880, duration: 0.03, type: 'sine', gain: 0.012 }),
}
