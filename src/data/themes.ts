import type { DomainId, ThemeId } from '../types'

export interface BoardTheme {
  id: ThemeId
  name: string
  shortName: string
  gradeLabel: string
  tagline: string
  emoji: string
  accent: string
  accent2: string
  accentSoft: string
  pageGlow: string
  boardBg: string
  boardEdge: string
  frameA: string
  frameB: string
  pattern: 'rays' | 'waves' | 'grid' | 'molecules' | 'orbits' | 'stars'
  artHue: number
  artSaturate: number
  ribbon: string
  cta: string
  ctaText: string
}

export const THEMES: Record<ThemeId, BoardTheme> = {
  g7: {
    id: 'g7',
    name: 'Первые открытия',
    shortName: 'Опыты',
    gradeLabel: '7 класс',
    tagline: 'Мир вокруг нас: от молекул до давления',
    emoji: '🧪',
    accent: '#ffc247',
    accent2: '#ff8a3d',
    accentSoft: 'rgba(255, 194, 71, 0.16)',
    pageGlow: 'rgba(255, 166, 61, 0.20)',
    boardBg: '#081426',
    boardEdge: '#0b1b33',
    frameA: '#ffd776',
    frameB: '#c97a25',
    pattern: 'rays',
    artHue: 0,
    artSaturate: 1,
    ribbon: 'linear-gradient(100deg, #ffdf8a, #ffb13d 45%, #e9822b)',
    cta: 'linear-gradient(180deg, #ffe19a, #ffb93e 52%, #f19422)',
    ctaText: '#3b2204',
  },
  g8: {
    id: 'g8',
    name: 'Тепло и ток',
    shortName: 'Энергия',
    gradeLabel: '8 класс',
    tagline: 'Тепловые, электрические и световые явления',
    emoji: '⚡',
    accent: '#ff6f85',
    accent2: '#ff9f5a',
    accentSoft: 'rgba(255, 111, 133, 0.15)',
    pageGlow: 'rgba(255, 92, 122, 0.18)',
    boardBg: '#1a0b17',
    boardEdge: '#261020',
    frameA: '#ff9baa',
    frameB: '#b23152',
    pattern: 'waves',
    artHue: -18,
    artSaturate: 1.1,
    ribbon: 'linear-gradient(100deg, #ffc2c9, #ff6f85 45%, #d94a6b)',
    cta: 'linear-gradient(180deg, #ffc4cb, #ff6f85 52%, #e24d6b)',
    ctaText: '#370811',
  },
  g9: {
    id: 'g9',
    name: 'Волны и атом',
    shortName: 'Импульс',
    gradeLabel: '9 класс',
    tagline: 'Законы Ньютона, колебания и ядерная физика',
    emoji: '🌊',
    accent: '#5cc8ff',
    accent2: '#6f8dff',
    accentSoft: 'rgba(92, 200, 255, 0.14)',
    pageGlow: 'rgba(70, 160, 255, 0.20)',
    boardBg: '#06142b',
    boardEdge: '#0a1f42',
    frameA: '#a7e6ff',
    frameB: '#2a6fc9',
    pattern: 'grid',
    artHue: 18,
    artSaturate: 1.05,
    ribbon: 'linear-gradient(100deg, #b9ecff, #5cc8ff 45%, #4a7cf0)',
    cta: 'linear-gradient(180deg, #c4f1ff, #56c4ff 52%, #3f8de8)',
    ctaText: '#04213b',
  },
  g10: {
    id: 'g10',
    name: 'Молекулы и поля',
    shortName: 'Поля',
    gradeLabel: '10 класс',
    tagline: 'Кинематика, молекулярная физика и электродинамика',
    emoji: '🔬',
    accent: '#4fe0a8',
    accent2: '#33c2a1',
    accentSoft: 'rgba(79, 224, 168, 0.14)',
    pageGlow: 'rgba(46, 205, 154, 0.18)',
    boardBg: '#041a19',
    boardEdge: '#062723',
    frameA: '#a9f5d7',
    frameB: '#1f8f76',
    pattern: 'molecules',
    artHue: 92,
    artSaturate: 0.95,
    ribbon: 'linear-gradient(100deg, #c8ffe9, #4fe0a8 45%, #21b289)',
    cta: 'linear-gradient(180deg, #c8ffe9, #4fe0a8 52%, #22ae86)',
    ctaText: '#03271d',
  },
  g11: {
    id: 'g11',
    name: 'Кванты и космос',
    shortName: 'Кванты',
    gradeLabel: '11 класс',
    tagline: 'Индукция, кванты, атомное ядро и Вселенная',
    emoji: '🚀',
    accent: '#c792ff',
    accent2: '#ff7ad9',
    accentSoft: 'rgba(199, 146, 255, 0.16)',
    pageGlow: 'rgba(156, 102, 255, 0.22)',
    boardBg: '#120826',
    boardEdge: '#1a0d36',
    frameA: '#e3c7ff',
    frameB: '#7b43c9',
    pattern: 'orbits',
    artHue: -42,
    artSaturate: 1.1,
    ribbon: 'linear-gradient(100deg, #eed8ff, #c792ff 45%, #9a55e8)',
    cta: 'linear-gradient(180deg, #ecd6ff, #c08bff 52%, #9555e0)',
    ctaText: '#240a3c',
  },
  review: {
    id: 'review',
    name: 'Физика без границ',
    shortName: 'Итоги',
    gradeLabel: 'Итоговое повторение',
    tagline: 'Вся программа: от первых опытов до квантовой физики',
    emoji: '🏆',
    accent: '#ffd36b',
    accent2: '#62e6ff',
    accentSoft: 'rgba(255, 211, 107, 0.15)',
    pageGlow: 'rgba(255, 190, 80, 0.18)',
    boardBg: '#0a1024',
    boardEdge: '#121a38',
    frameA: '#ffe7a6',
    frameB: '#5a4ec9',
    pattern: 'stars',
    artHue: 8,
    artSaturate: 1.08,
    ribbon: 'linear-gradient(100deg, #fff0b8, #ffc85a 40%, #5fe3ff)',
    cta: 'linear-gradient(180deg, #fff0b8, #ffce62 52%, #f5a623)',
    ctaText: '#3a2504',
  },
}

export const THEME_ICON: Record<ThemeId, string> = {
  g7: 'FlaskConical',
  g8: 'Thermometer',
  g9: 'Waves',
  g10: 'Atom',
  g11: 'Rocket',
  review: 'Trophy',
}

export const DOMAIN_META: Record<
  DomainId,
  { label: string; short: string; color: string; soft: string; icon: string }
> = {
  mechanics: { label: 'Механика', short: 'МЕХАНИКА', color: '#6d9bff', soft: '#dbe6ff', icon: 'Cog' },
  thermal: { label: 'Тепловые явления', short: 'ТЕПЛО', color: '#ff8a5c', soft: '#ffe1d5', icon: 'Thermometer' },
  electricity: { label: 'Электричество', short: 'ЭЛЕКТР', color: '#b58cff', soft: '#eadfff', icon: 'Zap' },
  waves: { label: 'Колебания и волны', short: 'ВОЛНЫ', color: '#4cc9f0', soft: '#d8f4ff', icon: 'Waves' },
  optics: { label: 'Оптика', short: 'ОПТИКА', color: '#43d6a5', soft: '#d6f8ea', icon: 'Eye' },
  molecular: { label: 'Молекулярная физика', short: 'МОЛЕКУЛЫ', color: '#7f9cff', soft: '#e0e7ff', icon: 'Atom' },
  quantum: { label: 'Квантовая физика', short: 'КВАНТЫ', color: '#ef7ad4', soft: '#fbe0f6', icon: 'Radiation' },
  astronomy: { label: 'Астрономия', short: 'КОСМОС', color: '#ffc44d', soft: '#fff2cf', icon: 'Orbit' },
  methods: { label: 'Методы познания', short: 'МЕТОД', color: '#8fa3c0', soft: '#e4ebf5', icon: 'Telescope' },
  custom: { label: 'Свои задания', short: 'СВОЁ', color: '#f2779f', soft: '#ffe0ea', icon: 'FlaskConical' },
}

export const TEAM_COLORS = [
  { id: 'blue', name: 'Синий', from: '#6ea8ff', to: '#2f63e0', ring: '#a9c8ff' },
  { id: 'red', name: 'Красный', from: '#ff8095', to: '#e0335c', ring: '#ffc0cc' },
  { id: 'green', name: 'Зелёный', from: '#78e3b4', to: '#18a977', ring: '#bdf5dd' },
  { id: 'amber', name: 'Янтарный', from: '#ffd479', to: '#e59412', ring: '#ffe7b3' },
  { id: 'violet', name: 'Фиолетовый', from: '#c79bff', to: '#8547dd', ring: '#e5d1ff' },
]

export const SPECIAL_COLORS = {
  start: 'linear-gradient(145deg, #f8fbff 0%, #dfe9f7 48%, #b9c8de 100%)',
  bonus: 'linear-gradient(145deg, #ffd8e6 0%, #ffa8c8 50%, #f2779f 100%)',
  bonus2: 'linear-gradient(145deg, #d8f3ff 0%, #99dcff 50%, #5fb8e8 100%)',
  rocket: 'linear-gradient(145deg, #ffe6a9 0%, #ffc75a 50%, #ee9b26 100%)',
  lab: 'linear-gradient(145deg, #e4d6ff 0%, #bb95ff 50%, #8a5ce6 100%)',
  practice: 'linear-gradient(145deg, #c8f7e1 0%, #7fe0b8 50%, #2aa877 100%)',
  problem: 'linear-gradient(145deg, #ffcfae 0%, #ff9a66 50%, #e56a3e 100%)',
  formula: 'linear-gradient(145deg, #fff3b8 0%, #ffda6b 50%, #e8b52d 100%)',
}
