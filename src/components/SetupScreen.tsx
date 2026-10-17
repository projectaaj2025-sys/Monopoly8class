import { useMemo, useState, type CSSProperties } from 'react'
import {
  ArrowRight,
  BookOpen,
  Check,
  CircleHelp,
  Dices,
  FlaskConical,
  GraduationCap,
  Layers,
  Library,
  ListChecks,
  RotateCcw,
  Search,
  Sparkles,
  Trophy,
  Users,
  Wand2,
  X,
} from 'lucide-react'
import type { GameConfig, GradeId, TeamTemplate, Topic } from '../types'
import {
  GRADE_LIST,
  GRADES,
  QUARTER_LABELS,
  allTopicsOfGrades,
  topicsOfGrade,
  topicsOfQuarter,
} from '../data/curriculum'
import { DOMAIN_META, TEAM_COLORS, THEMES, THEME_ICON } from '../data/themes'
import { BASE_QUESTIONS } from '../data/questions'
import {
  DEFAULT_ROUNDS,
  TEAM_PALETTE,
  buildBoard,
  buildGameConfig,
  countQuestions,
  formatNumber,
  pluralize,
} from '../game/engine'
import { sfx } from '../lib/sound'
import { gridPosition, tileBackground } from './Board'
import { Stepper } from './ui'
import { Icon } from './Icon'

type Mode = 'quarter' | 'year' | 'topics'

const DEFAULT_NAMES = ['Ньютоны', 'Эйнштейны', 'Теслы', 'Ломоносовы']
const TEAM_EMOJI = ['🍎', '🧠', '⚡', '🔭']
const MIN_TEAMS = 2
const MAX_TEAMS = 4
const DEFAULT_GRADE: GradeId = 8

const quarterKey = (grade: GradeId, quarter: number): string => `${grade}-${quarter}`

const formatQuarterList = (numbers: number[]): string => {
  const labels = [...numbers]
    .sort((a, b) => a - b)
    .map((n) => QUARTER_LABELS[n - 1] ?? String(n))
  if (labels.length === 0) return '—'
  if (labels.length === 1) return labels[0]
  return `${labels.slice(0, -1).join(', ')} и ${labels[labels.length - 1]}`
}

const pluralTopics = (n: number): string => `${n} ${pluralize(n, 'тема', 'темы', 'тем')}`
const pluralTasks = (n: number): string => `${n} ${pluralize(n, 'задание', 'задания', 'заданий')}`
const pluralClasses = (n: number): string => `${n} ${pluralize(n, 'класс', 'класса', 'классов')}`
const pluralQuestions = (n: number): string => `${n} ${pluralize(n, 'вопрос', 'вопроса', 'вопросов')}`

interface SetupScreenProps {
  boardsCount: number
  soundOn: boolean
  onToggleSound: () => void
  onStart: (config: GameConfig) => void
  onOpenLibrary: () => void
  onShowRules: () => void
}

export function SetupScreen({
  boardsCount,
  soundOn,
  onToggleSound,
  onStart,
  onOpenLibrary,
  onShowRules,
}: SetupScreenProps) {
  const [grades, setGrades] = useState<GradeId[]>([DEFAULT_GRADE])
  const [mode, setMode] = useState<Mode>('quarter')
  const [quarters, setQuarters] = useState<Set<string>>(
    () => new Set([quarterKey(DEFAULT_GRADE, 1)]),
  )
  const [topicIds, setTopicIds] = useState<Set<string>>(() => new Set())
  const [teamCount, setTeamCount] = useState(3)
  const [teamNames, setTeamNames] = useState<string[]>([...DEFAULT_NAMES])
  const [rounds, setRounds] = useState(DEFAULT_ROUNDS)
  const [search, setSearch] = useState('')

  const isMulti = grades.length > 1
  const primaryGrade = grades[0]
  const themeId = isMulti ? 'review' : GRADES[primaryGrade].theme
  const theme = THEMES[themeId]

  const selectedGradeObjects = useMemo(
    () => GRADE_LIST.filter((grade) => grades.includes(grade.id)),
    [grades],
  )

  const gradeTopics = useMemo(() => allTopicsOfGrades(grades), [grades])

  const activeTopics = useMemo(() => {
    if (mode === 'year') return gradeTopics
    if (mode === 'topics') {
      return gradeTopics.filter((topic) => topicIds.has(topic.id))
    }
    return gradeTopics.filter((topic) => quarters.has(quarterKey(topic.grade, topic.quarter)))
  }, [mode, gradeTopics, topicIds, quarters])

  const questionCount = useMemo(() => countQuestions(activeTopics), [activeTopics])
  const selectedQuarterNumbers = useMemo(
    () =>
      grades.map((grade) => ({
        grade,
        numbers: [...quarters]
          .filter((key) => key.startsWith(`${grade}-`))
          .map((key) => Number(key.split('-')[1])),
      })),
    [grades, quarters],
  )

  const previewBoard = useMemo(() => buildBoard(activeTopics.length > 0 ? activeTopics : gradeTopics), [
    activeTopics,
    gradeTopics,
  ])

  const allSelectedTopics = activeTopics.length === gradeTopics.length && activeTopics.length > 0
  const canStart = activeTopics.length > 0

  const toggleGrade = (grade: GradeId) => {
    sfx.tap()
    if (grades.includes(grade)) {
      if (grades.length === 1) return
      const nextGrades = grades.filter((item) => item !== grade)
      setGrades(nextGrades)
      if (nextGrades.length === 1) {
        const only = nextGrades[0]
        setQuarters(new Set([quarterKey(only, 1)]))
      }
      setTopicIds((prev) => {
        const allowed = new Set(allTopicsOfGrades(nextGrades).map((topic) => topic.id))
        return new Set([...prev].filter((id) => allowed.has(id)))
      })
      return
    }
    const nextGrades = [...grades, grade].sort((a, b) => a - b)
    setGrades(nextGrades)
    setQuarters((prev) => new Set([...prev, quarterKey(grade, 1)]))
    setTopicIds((prev) => {
      const next = new Set(prev)
      topicsOfQuarter(grade, 1).forEach((topic) => next.add(topic.id))
      return next
    })
  }

  const applyPreset = (preset: GradeId[]) => {
    sfx.open()
    setGrades(preset)
    setMode('year')
    setQuarters(new Set(preset.map((grade) => quarterKey(grade, 1))))
    setTopicIds(new Set(allTopicsOfGrades(preset).map((topic) => topic.id)))
    setSearch('')
  }

  const resetPreset = () => {
    sfx.tap()
    setGrades([DEFAULT_GRADE])
    setMode('quarter')
    setQuarters(new Set([quarterKey(DEFAULT_GRADE, 1)]))
    setTopicIds(new Set())
    setSearch('')
  }

  const toggleQuarter = (grade: GradeId, quarter: number) => {
    sfx.tap()
    const key = quarterKey(grade, quarter)
    setQuarters((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
    setTopicIds((prev) => {
      const next = new Set(prev)
      const quarterTopics = topicsOfQuarter(grade, quarter)
      if (quarters.has(key)) quarterTopics.forEach((topic) => next.delete(topic.id))
      else quarterTopics.forEach((topic) => next.add(topic.id))
      return next
    })
  }

  const selectAllQuarters = () => {
    sfx.tap()
    setQuarters(new Set(grades.flatMap((grade) => [1, 2, 3, 4].map((q) => quarterKey(grade, q)))))
  }

  const changeMode = (nextMode: Mode) => {
    sfx.tap()
    setMode(nextMode)
    if (nextMode === 'topics' && topicIds.size === 0) {
      const inherited = gradeTopics.filter((topic) =>
        quarters.has(quarterKey(topic.grade, topic.quarter)),
      )
      setTopicIds(new Set((inherited.length > 0 ? inherited : gradeTopics).map((topic) => topic.id)))
    }
  }

  const selectAllTopicsAction = () => {
    sfx.tap()
    setTopicIds(new Set(gradeTopics.map((topic) => topic.id)))
  }

  const toggleTopic = (topic: Topic) => {
    sfx.tap()
    setTopicIds((prev) => {
      const next = new Set(prev)
      if (next.has(topic.id)) next.delete(topic.id)
      else next.add(topic.id)
      return next
    })
  }

  const toggleAllTopics = () => {
    sfx.tap()
    if (allSelectedTopics) setTopicIds(new Set())
    else setTopicIds(new Set(gradeTopics.map((topic) => topic.id)))
  }

  const setTeamName = (index: number, value: string) => {
    setTeamNames((prev) => prev.map((name, i) => (i === index ? value : name)))
  }

  const subtitle = useMemo(() => {
    if (mode === 'year') {
      return `${isMulti ? 'Вся программа' : 'Весь учебный год'} · ${pluralTopics(activeTopics.length)}`
    }
    if (mode === 'topics') {
      return `Свой набор тем · ${pluralTopics(activeTopics.length)}`
    }
    const numbers = [...new Set(selectedQuarterNumbers.flatMap((item) => item.numbers))]
    return `${formatQuarterList(numbers)} ${numbers.length > 1 ? 'четверти' : 'четверть'} · ${pluralTopics(
      activeTopics.length,
    )}`
  }, [mode, isMulti, activeTopics.length, selectedQuarterNumbers])

  const title = useMemo(() => {
    if (isMulti) {
      const first = grades[0]
      const last = grades[grades.length - 1]
      return `Итоговое повторение · ${first}–${last} классы`
    }
    const grade = GRADES[primaryGrade]
    if (mode === 'year') return `${grade.label} · весь год`
    if (mode === 'topics') return `${grade.label} · свои темы`
    if (selectedQuarterNumbers[0]?.numbers.length === 1) {
      const quarterNumber = selectedQuarterNumbers[0].numbers[0]
      const quarter = grade.quarters.find((item) => item.number === quarterNumber)
      return `${grade.label} · ${quarter?.title ?? 'четверть'}`
    }
    return `${grade.label} · выбранные четверти`
  }, [grades, isMulti, mode, primaryGrade, selectedQuarterNumbers])

  const handleStart = () => {
    if (!canStart) return
    sfx.open()
    const templates: TeamTemplate[] = Array.from({ length: teamCount }).map((_, index) => ({
      name: teamNames[index]?.trim() || DEFAULT_NAMES[index],
      color: TEAM_PALETTE[index],
      emoji: TEAM_EMOJI[index],
    }))
    const config = buildGameConfig({
      source: 'curriculum',
      topics: activeTopics,
      themeId,
      subtitle,
      rounds,
      teamTemplates: templates,
    })
    config.title = title
    onStart(config)
  }

  const filteredTopics = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return gradeTopics
    return gradeTopics.filter((topic) =>
      `${topic.title} ${topic.short} ${topic.grade}`.toLowerCase().includes(query),
    )
  }, [gradeTopics, search])

  const preset79 = grades.length === 3 && grades.join(',') === '7,8,9' && mode === 'year'
  const preset711 = grades.length === 5 && mode === 'year'

  return (
    <div className="setup-page">
      <section className="hero">
        <div className="hero-bg" aria-hidden>
          <img src="/img/physics-center.jpg" alt="" />
        </div>
        <div className="hero-veil" aria-hidden />
        <div className="hero-inner">
          <div className="hero-badge">
            <span className="hero-badge-dot" />
            Образовательная монополия · физика · 7–11 классы
          </div>
          <h1 className="hero-title">
            ФИЗИКА<span className="hero-title-dash">-</span>ПОЛИ
          </h1>
          <div className="hero-ribbon">Путешествие в мир физики</div>
          <p className="hero-tagline">Знание · Скорость · Логика · Победа</p>
          <div className="hero-stats">
            <span>
              <Layers size={14} /> 28 клеток
            </span>
            <span>
              <GraduationCap size={14} /> 5 классов
            </span>
            <span>
              <FlaskConical size={14} /> {pluralTasks(BASE_QUESTIONS.length)}
            </span>
            <span>
              <Wand2 size={14} /> свои правила
            </span>
          </div>
        </div>
        <div className="hero-actions">
          <button
            type="button"
            className="hero-cta"
            onClick={() =>
              document.getElementById('setup')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
          >
            <span>
              <b>Начать игру</b>
              <small>выбрать класс и темы</small>
            </span>
            <ArrowRight size={17} />
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={onShowRules}>
            <CircleHelp size={16} /> Как играть
          </button>
          <button
            type="button"
            className="icon-btn icon-btn--glass"
            onClick={onToggleSound}
            aria-label={soundOn ? 'Выключить звук' : 'Включить звук'}
          >
            {soundOn ? '🔊' : '🔇'}
          </button>
        </div>
      </section>

      <div className="setup-stage" id="setup">
        <section className="panel setup-main">
          <div className="step-block">
            <div className="step-head">
              <span className="step-num">1</span>
              <div className="step-head-text">
                <h2>Выберите класс</h2>
                <p>Один класс или несколько — для итогового повторения всей программы.</p>
              </div>
              <span className="step-state">
                {pluralClasses(grades.length)} · {pluralTopics(gradeTopics.length)}
              </span>
            </div>

            <div className="grade-grid" id="grades">
              {GRADE_LIST.map((grade) => {
                const gradeTheme = THEMES[grade.theme]
                const selected = grades.includes(grade.id)
                return (
                  <button
                    key={grade.id}
                    type="button"
                    className={`grade-card ${selected ? 'is-selected' : ''}`}
                    style={
                      {
                        '--grade-accent': gradeTheme.accent,
                        '--grade-accent-2': gradeTheme.accent2,
                        '--grade-glow': gradeTheme.pageGlow,
                      } as CSSProperties
                    }
                    onClick={() => toggleGrade(grade.id)}
                    aria-pressed={selected}
                  >
                    <span className="grade-check">{selected ? <Check size={13} /> : <span />}</span>
                    <span className="grade-emoji"><Icon name={THEME_ICON[grade.theme]} size={21} /></span>
                    <span className="grade-label">{grade.label}</span>
                    <span className="grade-tagline">{gradeTheme.name}</span>
                    <span className="grade-meta">{pluralTopics(topicsOfGrade(grade.id).length)}</span>
                    <span className="grade-sheen" aria-hidden />
                  </button>
                )
              })}
              <div className="grade-note">
                <Sparkles size={15} />
                <span>
                  Отметьте несколько классов, чтобы собрать итоговое повторение. Дизайн поля меняется
                  вместе с классом.
                </span>
                {isMulti && (
                  <button type="button" className="link-btn" onClick={resetPreset}>
                    <RotateCcw size={13} /> сбросить
                  </button>
                )}
              </div>
            </div>

            <div className="preset-row">
              <button
                type="button"
                className={`preset-card ${preset79 ? 'is-active' : ''}`}
                onClick={() => applyPreset([7, 8, 9])}
              >
                <span className="preset-icon">
                  <Trophy size={18} />
                </span>
                <span className="preset-text">
                  <b>Итоги 7–9 классов</b>
                  <small>вся программа основной школы</small>
                </span>
                <span className="preset-count">{pluralTopics(allTopicsOfGrades([7, 8, 9]).length)}</span>
              </button>
              <button
                type="button"
                className={`preset-card preset-card--gold ${preset711 ? 'is-active' : ''}`}
                onClick={() => applyPreset([7, 8, 9, 10, 11])}
              >
                <span className="preset-icon">
                  <GraduationCap size={18} />
                </span>
                <span className="preset-text">
                  <b>Итоги 7–11 классов</b>
                  <small>полный курс физики школы</small>
                </span>
                <span className="preset-count">{pluralTopics(allTopicsOfGrades([7, 8, 9, 10, 11]).length)}</span>
              </button>
            </div>
          </div>

          <div className="step-divider" />

          <div className="step-block" id="format">
            <div className="step-head">
              <span className="step-num">2</span>
              <div className="step-head-text">
                <h2>Соберите содержание</h2>
                <p>Четверть, весь учебный год или свой набор тем.</p>
              </div>
              <div className="mode-switch">
                <button
                  type="button"
                  className={mode === 'quarter' ? 'is-active' : ''}
                  onClick={() => changeMode('quarter')}
                >
                  По четвертям
                </button>
                <button
                  type="button"
                  className={mode === 'year' ? 'is-active' : ''}
                  onClick={() => changeMode('year')}
                >
                  {isMulti ? 'Вся программа' : 'Весь год'}
                </button>
                <button
                  type="button"
                  className={mode === 'topics' ? 'is-active' : ''}
                  onClick={() => changeMode('topics')}
                >
                  Свои темы
                </button>
              </div>
            </div>

            {mode === 'quarter' && (
              <div className="quarter-area">
                <div className="quarter-toolbar">
                  <span>
                    <ListChecks size={14} /> Можно выбрать одну или несколько четвертей
                  </span>
                  <button type="button" className="link-btn" onClick={selectAllQuarters}>
                    выбрать все
                  </button>
                </div>
                {selectedGradeObjects.map((grade) => (
                  <div key={grade.id} className="quarter-group">
                    {isMulti && (
                      <div className="quarter-group-head">
                        <span className="mini-emoji"><Icon name={THEME_ICON[grade.theme]} size={12} /></span>
                        {grade.label}
                        <span>{pluralTopics(topicsOfGrade(grade.id).length)}</span>
                      </div>
                    )}
                    <div className="quarter-grid">
                      {grade.quarters.map((quarter) => {
                        const selected = quarters.has(quarterKey(grade.id, quarter.number))
                        return (
                          <button
                            key={quarter.number}
                            type="button"
                            className={`quarter-card ${selected ? 'is-selected' : ''}`}
                            onClick={() => toggleQuarter(grade.id, quarter.number)}
                            aria-pressed={selected}
                          >
                            <div className="quarter-top">
                              <span className="quarter-roman">{QUARTER_LABELS[quarter.number - 1]}</span>
                              <span className="quarter-name">{quarter.title}</span>
                              <span className={`quarter-check ${selected ? 'is-on' : ''}`}>
                                {selected ? <Check size={12} /> : null}
                              </span>
                            </div>
                            <div className="quarter-topics">
                              {quarter.topics.slice(0, 3).map((topic) => (
                                <span key={topic.id}>{topic.short}</span>
                              ))}
                              {quarter.topics.length > 3 && (
                                <span className="quarter-more">+{quarter.topics.length - 3}</span>
                              )}
                            </div>
                            <div className="quarter-foot">
                              {pluralTopics(quarter.topics.length)}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {mode === 'year' && (
              <div className="year-area">
                <div className="year-note">
                  <BookOpen size={17} />
                  <span>
                    В игру войдут все темы {isMulti ? 'выбранных классов' : 'учебного года'} — от первой
                    до последней четверти.
                  </span>
                </div>
                <div className="year-grid">
                  {selectedGradeObjects.map((grade) => (
                    <div key={grade.id} className="year-grade">
                      <div className="year-grade-head">
                        <span className="mini-emoji"><Icon name={THEME_ICON[grade.theme]} size={12} /></span>
                        <div>
                          <b>{grade.label}</b>
                          <small>{grade.tagline}</small>
                        </div>
                        <span className="year-count">{pluralTopics(topicsOfGrade(grade.id).length)}</span>
                      </div>
                      <div className="year-quarters">
                        {grade.quarters.map((quarter) => (
                          <div key={quarter.number} className="year-quarter">
                            <span className="year-quarter-num">{QUARTER_LABELS[quarter.number - 1]}</span>
                            <div>
                              <b>{quarter.title}</b>
                              <small>{quarter.topics.map((topic) => topic.short).slice(0, 3).join(' · ')}</small>
                            </div>
                            <span className="year-quarter-topics">{quarter.topics.length}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {mode === 'topics' && (
              <div className="topics-area">
                <div className="topics-toolbar">
                  <div className="search-field">
                    <Search size={15} />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Найти тему: давление, линзы, фотоэффект…"
                      aria-label="Поиск темы"
                    />
                    {search && (
                      <button type="button" onClick={() => setSearch('')} aria-label="Очистить поиск">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  <div className="topics-actions">
                    <span className="topics-count">
                      {activeTopics.length} / {gradeTopics.length}
                    </span>
                    <button type="button" className="link-btn" onClick={toggleAllTopics}>
                      {allSelectedTopics ? 'снять все' : 'выбрать все'}
                    </button>
                  </div>
                </div>
                <div className="topics-scroll">
                  {selectedGradeObjects.map((grade) => {
                    const filteredGrade = filteredTopics.filter((topic) => topic.grade === grade.id)
                    if (filteredGrade.length === 0) return null
                    return (
                      <div key={grade.id} className="topics-group">
                        <div className="topics-group-head">
                          <span className="mini-emoji"><Icon name={THEME_ICON[grade.theme]} size={12} /></span>
                          {grade.label}
                          <span>
                            {filteredGrade.filter((topic) => topicIds.has(topic.id)).length} /{' '}
                            {filteredGrade.length}
                          </span>
                        </div>
                        {grade.quarters.map((quarter) => {
                          const quarterTopics = filteredGrade.filter(
                            (topic) => topic.quarter === quarter.number,
                          )
                          if (quarterTopics.length === 0) return null
                          return (
                            <div key={quarter.number} className="topic-quarter-row">
                              <span className="topic-quarter-label">
                                {QUARTER_LABELS[quarter.number - 1]} четв.
                              </span>
                              <div className="topic-chips">
                                {quarterTopics.map((topic) => {
                                  const selected = topicIds.has(topic.id)
                                  const domain = DOMAIN_META[topic.domain]
                                  return (
                                    <button
                                      key={topic.id}
                                      type="button"
                                      className={`topic-chip ${selected ? 'is-selected' : ''}`}
                                      onClick={() => toggleTopic(topic)}
                                      title={topic.title}
                                      aria-pressed={selected}
                                      style={{ '--dot': domain.color } as CSSProperties}
                                    >
                                      <span className="topic-dot" />
                                      {topic.short}
                                      {selected && <Check size={12} />}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                  {filteredTopics.length === 0 && (
                    <div className="topics-empty">
                      <Search size={20} />
                      <p>Ничего не найдено. Попробуйте другое слово.</p>
                    </div>
                  )}
                  {activeTopics.length === 0 && (
                    <div className="topics-warning">
                      <CircleHelp size={17} />
                      <span>
                        Ни одна тема не выбрана — отметьте темы, иначе игру нельзя начать.
                      </span>
                      <button type="button" className="btn btn--ghost btn--sm" onClick={selectAllTopicsAction}>
                        Выбрать все темы
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        <aside className="setup-aside">
          <div className="game-ticket panel">
            <div
              className="ticket-preview"
              style={
                {
                  '--accent': theme.accent,
                  '--accent-2': theme.accent2,
                  '--frame-a': theme.frameA,
                  '--frame-b': theme.frameB,
                  '--board-bg': theme.boardBg,
                } as CSSProperties
              }
            >
              <div className="mini-board">
                {previewBoard.map((cell) => {
                  const pos = gridPosition(cell.index)
                  return (
                    <span
                      key={cell.index}
                      className="mini-tile"
                      style={{
                        gridRow: pos.gridRow,
                        gridColumn: pos.gridColumn,
                        background: tileBackground(cell),
                      }}
                    />
                  )
                })}
                <div className="mini-center">
                  <span className="mini-center-emoji"><Icon name={THEME_ICON[themeId]} size={22} /></span>
                  <b>{isMulti ? 'Итоги' : GRADES[primaryGrade].label}</b>
                  <small>{theme.name}</small>
                </div>
              </div>
              <div className="ticket-chip">
                <span className="live-dot" /> игра готова к запуску
              </div>
            </div>

            <div className="ticket-body">
              <div className="ticket-eyebrow">Ваша игра</div>
              <h2 className="ticket-title">{title}</h2>
              <p className="ticket-sub">{subtitle}</p>

              <div className="ticket-classes">
                {grades.map((grade) => (
                  <span key={grade} className="class-chip">
                    <Icon name={THEME_ICON[GRADES[grade].theme]} size={11} /> {grade}
                  </span>
                ))}
                {grades.length > 1 && <span className="class-chip class-chip--review">итоги</span>}
              </div>

              <div className="ticket-stats">
                <div className="ticket-stat">
                  <span>Тем в игре</span>
                  <b>{activeTopics.length}</b>
                </div>
                <div className="ticket-stat">
                  <span>Заданий в банке</span>
                  <b>{questionCount}</b>
                </div>
                <div className="ticket-stat">
                  <span>Клеток поля</span>
                  <b>28</b>
                </div>
                <div className="ticket-stat">
                  <span>Ходов</span>
                  <b>{formatNumber(rounds * teamCount)}</b>
                </div>
              </div>

              <div className="ticket-divider" />

              <div className="ticket-mode">
                <span className={`mode-badge mode-badge--${mode}`}>
                  {mode === 'quarter' ? (
                    <>
                      <ListChecks size={12} /> по четвертям
                    </>
                  ) : mode === 'year' ? (
                    <>
                      <BookOpen size={12} /> {isMulti ? 'вся программа' : 'весь год'}
                    </>
                  ) : (
                    <>
                      <Search size={12} /> свои темы
                    </>
                  )}
                </span>
                <span className="ticket-mode-note">
                  {mode === 'topics'
                    ? 'выбрано вручную'
                    : mode === 'year'
                      ? 'все четверти'
                      : 'выбранные четверти'}
                </span>
              </div>

              <div className="ticket-section">
                <div className="ticket-section-head">
                  <span>
                    <Users size={15} /> Команды
                  </span>
                  <span className="ticket-hint">от 2 до 4</span>
                </div>
                <Stepper value={teamCount} min={MIN_TEAMS} max={MAX_TEAMS} onChange={(value) => {
                  sfx.tap()
                  setTeamCount(value)
                }} />
                <div className="team-inputs">
                  {Array.from({ length: teamCount }).map((_, index) => {
                    const palette = TEAM_COLORS[index]
                    return (
                      <label key={index} className="team-input" style={{ '--dot': palette.from } as CSSProperties}>
                        <span className="team-dot">{TEAM_EMOJI[index]}</span>
                        <input
                          value={teamNames[index] ?? ''}
                          onChange={(event) => setTeamName(index, event.target.value)}
                          placeholder={DEFAULT_NAMES[index]}
                          maxLength={18}
                          aria-label={`Название команды ${index + 1}`}
                        />
                      </label>
                    )
                  })}
                </div>
              </div>

              <div className="ticket-section ticket-section--row">
                <div>
                  <div className="ticket-section-head">
                    <span>
                      <Dices size={15} /> Кругов
                    </span>
                  </div>
                  <p className="ticket-hint">каждая команда сыграет {rounds} ходов</p>
                </div>
                <Stepper
                  value={rounds}
                  min={4}
                  max={12}
                  onChange={(value) => {
                    sfx.tap()
                    setRounds(value)
                  }}
                />
              </div>

              <button type="button" className="start-btn" onClick={handleStart} disabled={!canStart}>
                <span>
                  Начать игру
                  <small>{canStart ? `${activeTopics.length} тем · ${rounds * teamCount} ходов` : 'Выберите темы'}</small>
                </span>
                <ArrowRight size={20} />
              </button>
              <p className="start-note">
                {canStart
                  ? 'Играть можно сразу — вопросы уже готовы.'
                  : 'Отметьте хотя бы одну тему или четверть.'}
              </p>
            </div>
          </div>

          <button type="button" className="custom-cta" onClick={onOpenLibrary}>
            <span className="custom-cta-icon">
              <Wand2 size={20} />
            </span>
            <span className="custom-cta-text">
              <b>Своя монополия</b>
              <small>Добавьте задания и создайте игру с нуля</small>
            </span>
            <span className="custom-cta-count">
              <Library size={14} /> {boardsCount}
            </span>
          </button>

          <button type="button" className="rules-link" onClick={onShowRules}>
            <CircleHelp size={15} /> Правила и советы для учителя
          </button>
        </aside>
      </div>

      <footer className="setup-footer">
        <div className="setup-footer-inner">
          <span>
            <Sparkles size={14} /> ФИЗИКА-ПОЛИ · образовательная монополия
          </span>
          <span>
            <BookOpen size={14} /> 7–11 классы · итоговые повторения · авторские задания
          </span>
          <span>
            <Trophy size={14} /> {pluralQuestions(BASE_QUESTIONS.length)} в банке заданий
          </span>
        </div>
      </footer>
    </div>
  )
}
