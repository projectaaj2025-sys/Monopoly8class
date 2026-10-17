import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
  Dices,
  Flag,
  FlaskConical,
  Gift,
  Lightbulb,
  LogOut,
  Pause,
  Rocket,
  RotateCcw,
  ShieldQuestion,
  Sigma,
  Sparkles,
  Trophy,
  Users,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import type {
  ActiveQuestion,
  BonusEvent,
  GameConfig,
  GamePhase,
  LogEntry,
  Team,
} from '../types'
import { DOMAIN_META, TEAM_COLORS, THEMES } from '../data/themes'
import {
  drawQuestion,
  formatNumber,
  makeTeams,
  pickBonus,
  pluralize,
  rollDie,
  RING_SIZE,
  teamVerb,
} from '../game/engine'
import { sfx } from '../lib/sound'
import { Board } from './Board'
import { QuestionModal } from './QuestionModal'
import { ResultsScreen } from './ResultsScreen'
import { Modal, Pill } from './ui'
import { Icon } from './Icon'

interface GameScreenProps {
  config: GameConfig
  soundOn: boolean
  onToggleSound: () => void
  onExit: () => void
  onSettings: () => void
  onRestart: (config: GameConfig) => void
  onShowRules: () => void
}

const PIP_MAP: Record<number, number[]> = {
  1: [4],
  2: [0, 8],
  3: [0, 4, 8],
  4: [0, 2, 6, 8],
  5: [0, 2, 4, 6, 8],
  6: [0, 2, 3, 5, 6, 8],
}

const isContentCell = (kind: string): boolean =>
  kind === 'topic' ||
  kind === 'formula' ||
  kind === 'problem' ||
  kind === 'practice' ||
  kind === 'lab' ||
  kind === 'question'

const initialLogs = (config: GameConfig): LogEntry[] => [
  {
    id: 1,
    text: `Игра началась · ${config.title}`,
    tone: 'neutral',
  },
  {
    id: 2,
    text: `В игре ${config.teamTemplates.length} команды · ${config.rounds} кругов`,
    tone: 'neutral',
  },
]

export function GameScreen({
  config,
  soundOn,
  onToggleSound,
  onExit,
  onSettings,
  onRestart,
  onShowRules,
}: GameScreenProps) {
  const theme = THEMES[config.themeId] ?? THEMES.g7
  const [teams, setTeams] = useState<Team[]>(() => makeTeams(config.teamTemplates))
  const [activeIndex, setActiveIndex] = useState(0)
  const [phase, setPhase] = useState<GamePhase>('idle')
  const [die, setDie] = useState(1)
  const [rollNonce, setRollNonce] = useState(0)
  const [owners, setOwners] = useState<Record<number, string>>({})
  const [activeQuestion, setActiveQuestion] = useState<ActiveQuestion | null>(null)
  const [pendingEvent, setPendingEvent] = useState<(BonusEvent & { eyebrow?: string }) | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>(() => initialLogs(config))
  const [turn, setTurn] = useState(0)
  const [toast, setToast] = useState<{ id: number; text: string; tone: 'good' | 'bad' | 'neutral' } | null>(null)
  const [confirmEnd, setConfirmEnd] = useState(false)
  const [confirmRestart, setConfirmRestart] = useState(false)

  const usedRef = useRef<Set<string>>(new Set())
  const turnRef = useRef(0)
  const logIdRef = useRef(3)
  const timersRef = useRef<number[]>([])
  const toastTimerRef = useRef<number | null>(null)

  const activeTeam = teams[activeIndex]
  const teamIs = (plural: string, singular: string) => teamVerb(activeTeam?.name, plural, singular)
  const contentCells = useMemo(() => config.board.filter((cell) => isContentCell(cell.kind)), [config.board])
  const captured = Object.keys(owners).length
  const round = Math.min(config.rounds, Math.floor(turn / Math.max(1, teams.length)) + 1)
  const progress = config.maxMoves > 0 ? (turn / config.maxMoves) * 100 : 0

  const schedule = (fn: () => void, delay: number) => {
    const id = window.setTimeout(fn, delay)
    timersRef.current.push(id)
    return id
  }

  useEffect(
    () => () => {
      timersRef.current.forEach((id) => window.clearTimeout(id))
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
    },
    [],
  )

  const pushLog = (text: string, tone: LogEntry['tone'] = 'neutral') => {
    logIdRef.current += 1
    const entry: LogEntry = { id: logIdRef.current, text, tone }
    setLogs((prev) => [entry, ...prev].slice(0, 40))
  }

  const showToast = (text: string, tone: 'good' | 'bad' | 'neutral' = 'good') => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current)
    setToast({ id: Date.now(), text, tone })
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2800)
  }

  const finishGame = () => {
    setPhase('finished')
    setActiveQuestion(null)
    setPendingEvent(null)
    setConfirmEnd(false)
    sfx.win()
  }

  const advanceTurn = (extraRoll = false) => {
    setActiveQuestion(null)
    setPendingEvent(null)
    setPhase('idle')
    if (extraRoll) {
      pushLog(`${activeTeam?.name ?? 'Команда'} ${teamIs('бросают', 'бросает')} кубик ещё раз`, 'good')
      return
    }
    const next = turnRef.current + 1
    turnRef.current = next
    setTurn(next)
    setActiveIndex((prev) => (prev + 1) % teams.length)
    if (next >= config.maxMoves) {
      schedule(finishGame, 420)
    }
  }

  const land = (position: number) => {
    const cell = config.board.find((item) => item.index === position)
    if (!cell) {
      advanceTurn(false)
      return
    }

    if (cell.kind === 'start') {
      pushLog(`${activeTeam?.name ?? 'Команда'} ${teamIs('остановились', 'остановилась')} на старте`, 'neutral')
      showToast('Круг пройден! +100 очков', 'good')
      schedule(() => advanceTurn(false), 700)
      return
    }

    if (cell.kind === 'bonus') {
      const event = pickBonus()
      setPendingEvent({ ...event, eyebrow: 'Бонусная клетка' })
      setPhase('event')
      sfx.bonus()
      pushLog(`${activeTeam?.name ?? 'Команда'} ${teamIs('попали', 'попала')} на клетку «${cell.title}»`, 'good')
      return
    }

    if (cell.kind === 'rocket') {
      setPendingEvent({
        eyebrow: 'Космическая клетка',
        icon: 'Rocket',
        title: 'Ракета!',
        description: 'Команда запускает ракету: +250 очков и дополнительный бросок кубика.',
        points: 250,
        extraRoll: true,
      })
      setPhase('event')
      sfx.bonus()
      pushLog(`${activeTeam?.name ?? 'Команда'} ${teamIs('запустили', 'запустила')} ракету`, 'good')
      return
    }

    const { question, usedIds } = drawQuestion(cell, config.topics, config.customBoard, usedRef.current)
    usedRef.current = usedIds
    if (!question) {
      pushLog('Для этой клетки пока нет заданий — бросайте снова', 'neutral')
      showToast('Нет задания для клетки', 'neutral')
      advanceTurn(false)
      return
    }
    const source = cell.kind === 'question' ? 'custom' : (cell.kind as ActiveQuestion['source'])
    setActiveQuestion({ question, cell, points: cell.points, source })
    setPhase('question')
    sfx.open()
  }

  const startRoll = () => {
    if (phase !== 'idle' || !activeTeam) return
    const value = rollDie()
    setDie(value)
    setRollNonce((prev) => prev + 1)
    setPhase('moving')
    sfx.roll()
    const start = activeTeam.position
    pushLog(`${activeTeam.name} ${teamIs('бросают', 'бросает')} кубик: ${value}`, 'neutral')

    for (let step = 1; step <= value; step += 1) {
      schedule(() => {
        const nextPosition = (start + step) % RING_SIZE
        setTeams((prev) =>
          prev.map((team, index) =>
            index === activeIndex
              ? {
                  ...team,
                  position: nextPosition,
                  score: team.score + (nextPosition === 0 ? 100 : 0),
                }
              : team,
          ),
        )
        sfx.step()
        if (nextPosition === 0) {
          pushLog(`${activeTeam.name} ${teamIs('прошли', 'прошла')} круг: +100 очков`, 'good')
        }
      }, step * 140)
    }

    schedule(() => land((start + value) % RING_SIZE), value * 140 + 220)
  }

  const claimEvent = () => {
    if (!pendingEvent) return
    if (pendingEvent.points) {
      setTeams((prev) =>
        prev.map((team, index) =>
          index === activeIndex ? { ...team, score: team.score + (pendingEvent.points ?? 0) } : team,
        ),
      )
      pushLog(`${activeTeam?.name ?? 'Команда'} ${teamIs('получают', 'получает')} +${pendingEvent.points} очков`, 'good')
      showToast(`+${pendingEvent.points} очков!`, 'good')
    }
    const extra = Boolean(pendingEvent.extraRoll)
    sfx.bonus()
    setPendingEvent(null)
    advanceTurn(extra)
  }

  const resolveQuestion = (correct: boolean, meta: { timedOut?: boolean; override?: boolean }) => {
    if (!activeQuestion) return
    const cell = activeQuestion.cell
    const team = teams[activeIndex]
    const previousOwnerId = owners[cell.index]
    const recapture = Boolean(previousOwnerId && previousOwnerId !== team.id)
    let nextOwners = owners

    if (correct) {
      const earned = activeQuestion.points + (recapture ? 50 : 0)
      nextOwners = { ...owners, [cell.index]: team.id }
      setOwners(nextOwners)
      setTeams((prev) =>
        prev.map((item, index) =>
          index === activeIndex
            ? {
                ...item,
                score: item.score + earned,
                correct: item.correct + 1,
                captures: item.captures + (recapture ? 1 : 0),
              }
            : item,
        ),
      )
      pushLog(
        `${team.name}: ${meta.override ? 'ответ засчитан учителем' : 'верный ответ'} · +${earned}${
          recapture ? ' (перехват клетки)' : ''
        }`,
        'good',
      )
      showToast(recapture ? `Перехват клетки! +${earned}` : `Верно! +${earned} очков`, 'good')
    } else {
      setTeams((prev) =>
        prev.map((item, index) => (index === activeIndex ? { ...item, wrong: item.wrong + 1 } : item)),
      )
      pushLog(`${team.name}: неверный ответ${meta.timedOut ? ' (время вышло)' : ''}`, 'bad')
    }

    setActiveQuestion(null)

    if (correct && Object.keys(nextOwners).length >= contentCells.length) {
      pushLog('Все клетки поля открыты! Игра завершена', 'good')
      schedule(finishGame, 350)
      return
    }
    advanceTurn(false)
  }

  const skipQuestion = () => {
    if (!activeQuestion) return
    pushLog(`${activeTeam?.name ?? 'Команда'} пропустила вопрос`, 'neutral')
    setActiveQuestion(null)
    advanceTurn(false)
  }

  const resetGame = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id))
    timersRef.current = []
    usedRef.current = new Set()
    turnRef.current = 0
    logIdRef.current = 3
    setTeams(makeTeams(config.teamTemplates))
    setActiveIndex(0)
    setPhase('idle')
    setDie(1)
    setOwners({})
    setActiveQuestion(null)
    setPendingEvent(null)
    setTurn(0)
    setLogs(initialLogs(config))
    setToast(null)
    setConfirmEnd(false)
    setConfirmRestart(false)
  }

  if (phase === 'finished') {
    return (
      <ResultsScreen
        config={config}
        teams={teams}
        turns={turn}
        captured={captured}
        totalCells={contentCells.length}
        onRestart={() => onRestart(config)}
        onSettings={onSettings}
        onExit={onExit}
      />
    )
  }

  const ownerName = activeQuestion
    ? teams.find((team) => team.id === owners[activeQuestion.cell.index])?.name ?? null
    : null

  const pips = PIP_MAP[die] ?? PIP_MAP[1]
  const isMoving = phase === 'moving'

  return (
    <div className="game-screen">
      <header className="game-topbar">
        <div className="game-topbar-left">
          <button type="button" className="icon-btn icon-btn--ghost" onClick={onExit} aria-label="Выйти в меню">
            <ArrowLeft size={18} />
          </button>
          <div className="game-heading">
            <div className="game-heading-eyebrow">
              <span className="live-dot" />
              Идёт игра · {theme.gradeLabel}
            </div>
            <h1>{config.title}</h1>
          </div>
        </div>
        <div className="game-topbar-meta">
          <Pill tone="neutral">
            <Icon name="FlaskConical" size={14} /> {config.topics.length}{' '}
            {pluralize(config.topics.length, 'тема', 'темы', 'тем')}
          </Pill>
          <Pill tone="neutral">
            <Dices size={14} /> {config.rounds} {pluralize(config.rounds, 'круг', 'круга', 'кругов')}
          </Pill>
          <div className="topbar-actions">
            <button
              type="button"
              className="icon-btn icon-btn--ghost"
              onClick={onToggleSound}
              aria-label={soundOn ? 'Выключить звук' : 'Включить звук'}
              title={soundOn ? 'Выключить звук' : 'Включить звук'}
            >
              {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
            <button type="button" className="icon-btn icon-btn--ghost" onClick={onShowRules} aria-label="Правила">
              <CircleHelp size={18} />
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setConfirmEnd(true)}>
              <LogOut size={15} /> Завершить
            </button>
          </div>
        </div>
      </header>

      <div className="game-grid">
        <aside className="team-panel panel">
          <div className="panel-head">
            <div>
              <div className="eyebrow">
                <Users size={13} /> Команды
              </div>
              <h2>Счёт игры</h2>
            </div>
            <span className="count-badge">{teams.length}</span>
          </div>

          <div className="team-list">
            {teams.map((team, index) => {
              const palette = TEAM_COLORS.find((color) => color.id === team.color) ?? TEAM_COLORS[0]
              const isActive = index === activeIndex
              return (
                <div
                  key={team.id}
                  className={`team-card ${isActive ? 'is-active' : ''}`}
                  style={{
                    '--team-from': palette.from,
                    '--team-to': palette.to,
                    '--team-ring': palette.ring,
                  } as CSSProperties}
                >
                  <div className="team-token">
                    <span>{team.emoji}</span>
                  </div>
                  <div className="team-info">
                    <div className="team-name">
                      {team.name}
                      {isActive && <span className="team-turn">ход</span>}
                    </div>
                    <div className="team-mini">
                      <span>
                        <Check size={9} /> {team.correct}
                      </span>
                      <span>
                        <X size={9} /> {team.wrong}
                      </span>
                      <span>
                        <Flag size={9} /> {team.captures}
                      </span>
                    </div>
                  </div>
                  <div className="team-score">
                    {formatNumber(team.score)}
                    <small>очков</small>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="round-block">
            <div className="round-meta">
              <span>
                <Trophy size={14} /> Круг {round} из {config.rounds}
              </span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="round-track">
              <div className="round-fill" style={{ width: `${Math.min(100, progress)}%` }} />
            </div>
            <div className="round-foot">
              <span>
                Открыто {captured} из {contentCells.length} {pluralize(contentCells.length, 'клетки', 'клеток', 'клеток')}
              </span>
              <span>
                Ходов: {turn}/{config.maxMoves}
              </span>
            </div>
          </div>

          <div className="teacher-panel">
            <div className="teacher-panel-head">
              <ShieldQuestion size={16} />
              <span>Панель учителя</span>
            </div>
            <button
              type="button"
              className="teacher-btn"
              onClick={() => {
                pushLog(`${activeTeam?.name ?? 'Команда'}: ход пропущен`, 'neutral')
                advanceTurn(false)
              }}
              disabled={phase !== 'idle'}
            >
              <Pause size={15} /> Пропустить ход
            </button>
            <button type="button" className="teacher-btn" onClick={() => setConfirmRestart(true)}>
              <RotateCcw size={15} /> Начать заново
            </button>
            <button type="button" className="teacher-btn teacher-btn--danger" onClick={() => setConfirmEnd(true)}>
              <Flag size={15} /> Завершить игру
            </button>
          </div>
        </aside>

        <main className="board-column">
          <Board
            config={config}
            teams={teams}
            owners={owners}
            activeTeamId={activeTeam?.id}
            highlight={activeQuestion?.cell.index ?? null}
            center={
              <div className="center-stage">
                <div className="center-brandline">
                  <Sparkles size={13} /> ФИЗИКА-ПОЛИ
                </div>
                <h2 className="center-title">{config.title}</h2>
                <div className="center-ribbon">{config.subtitle}</div>

                <div className="turn-box">
                  <div className="turn-label">Ход команды</div>
                  <div className="turn-team">
                    <span
                      className="turn-token"
                      style={{
                        background: `linear-gradient(150deg, ${
                          TEAM_COLORS.find((color) => color.id === activeTeam?.color)?.from ?? '#6ea8ff'
                        }, ${TEAM_COLORS.find((color) => color.id === activeTeam?.color)?.to ?? '#2f63e0'})`,
                      }}
                    >
                      {activeTeam?.emoji}
                    </span>
                    {activeTeam?.name}
                  </div>
                </div>

                <div className="dice-row">
                  <div key={rollNonce} className={`die ${isMoving ? 'is-rolling' : ''}`} aria-label={`Кубик: ${die}`}>
                    {Array.from({ length: 9 }).map((_, index) => (
                      <span key={index} className={`pip ${pips.includes(index) ? 'is-on' : ''}`} />
                    ))}
                  </div>
                  <button
                    type="button"
                    className="roll-btn"
                    onClick={startRoll}
                    disabled={phase !== 'idle'}
                  >
                    {isMoving ? (
                      <>
                        <span className="roll-dots">
                          <i />
                          <i />
                          <i />
                        </span>
                        Команда в пути
                      </>
                    ) : (
                      <>
                        <Dices size={19} /> Бросить кубик
                      </>
                    )}
                  </button>
                </div>

                <div className="center-foot">
                  <span>
                    <BookOpen size={13} /> {captured} клеток открыто
                  </span>
                  <span className="center-foot-dot" />
                  <span>Круг {round}/{config.rounds}</span>
                </div>
              </div>
            }
          />
          <div className="board-below">
            <div className="field-topics">
              <div className="field-topics-head">
                <span>
                  <BookOpen size={13} /> Темы на этом поле
                </span>
                <span className="field-topics-count">
                  {config.topics.length > 0
                    ? `${config.topics.length} ${pluralize(config.topics.length, 'тема', 'темы', 'тем')}`
                    : 'своя программа'}
                </span>
              </div>
              <div className="field-topics-list">
                {config.topics.slice(0, 18).map((topic) => (
                  <span
                    key={topic.id}
                    className="field-topic"
                    title={topic.title}
                  >
                    <i style={{ background: DOMAIN_META[topic.domain]?.color }} />
                    {topic.short}
                  </span>
                ))}
                {config.topics.length > 18 && (
                  <span className="field-topic field-topic--more">+{config.topics.length - 18}</span>
                )}
                {config.topics.length === 0 && (
                  <span className="field-topic field-topic--more">Авторские категории</span>
                )}
              </div>
            </div>
            <div className="board-hint">
              <span>
                <Gift size={14} /> Бонусные клетки дают очки и дополнительные броски
              </span>
              <span>
                <Rocket size={14} /> Верный ответ закрепляет клетку за командой
              </span>
            </div>
          </div>
        </main>

        <aside className="feed-panel panel">
          <div className="panel-head">
            <div>
              <div className="eyebrow">
                <span className="live-dot" /> В эфире
              </div>
              <h2>Хроника игры</h2>
            </div>
            <ChevronRight size={18} className="feed-chevron" />
          </div>
          <div className="feed-list">
            {logs.map((entry) => (
              <div key={entry.id} className={`feed-item tone-${entry.tone ?? 'neutral'}`}>
                <span className="feed-dot" />
                <p>{entry.text}</p>
              </div>
            ))}
          </div>
          <div className="feed-footer">
            <div className="feed-legend">
              <span>
                <i className="legend-swatch legend-swatch--good" /> успех
              </span>
              <span>
                <i className="legend-swatch legend-swatch--bad" /> ошибка
              </span>
            </div>
            <div className="cell-legend">
              <span>
                <i className="cell-swatch" style={{ background: 'linear-gradient(145deg,#fff3b8,#e8b52d)' }}>
                  <Sigma size={9} />
                </i>
                формула · 150
              </span>
              <span>
                <i className="cell-swatch" style={{ background: 'linear-gradient(145deg,#ffcfae,#e56a3e)' }}>
                  <Lightbulb size={9} />
                </i>
                задача · 200
              </span>
              <span>
                <i className="cell-swatch" style={{ background: 'linear-gradient(145deg,#e4d6ff,#8a5ce6)' }}>
                  <FlaskConical size={9} />
                </i>
                лаборатория · 250
              </span>
              <span>
                <i className="cell-swatch" style={{ background: 'linear-gradient(145deg,#ffe6a9,#ee9b26)' }}>
                  <Rocket size={9} />
                </i>
                ракета · +250
              </span>
            </div>
            <p>Все ответы фиксируются в хронике — удобно для анализа урока.</p>
          </div>
        </aside>
      </div>

      <QuestionModal
        open={phase === 'question' && Boolean(activeQuestion)}
        active={activeQuestion}
        team={activeTeam ?? null}
        ownerName={ownerName}
        onResolve={resolveQuestion}
        onSkip={skipQuestion}
      />

      <Modal
        open={phase === 'event' && Boolean(pendingEvent)}
        size="sm"
        className="event-modal"
        closeOnBackdrop={false}
      >
        {pendingEvent && (
          <div className="event-content">
            <div className="event-orb">
              <Icon name={pendingEvent.icon} size={34} strokeWidth={1.8} />
            </div>
            <div className="event-eyebrow">{pendingEvent.eyebrow ?? 'Событие'}</div>
            <h2>{pendingEvent.title}</h2>
            <p>{pendingEvent.description}</p>
            {pendingEvent.points ? <div className="event-points">+{pendingEvent.points}</div> : null}
            <button type="button" className="btn btn--primary btn--lg event-cta" onClick={claimEvent}>
              {pendingEvent.points ? 'Забрать награду' : 'Продолжить'} <ChevronRight size={18} />
            </button>
            <div className="event-team">
              Команда: <b>{activeTeam?.name}</b>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={confirmEnd} onClose={() => setConfirmEnd(false)} size="sm" className="confirm-modal">
        <div className="confirm-icon">
          <Flag size={26} />
        </div>
        <h2>Завершить игру?</h2>
        <p>Текущие результаты сохранятся на экране итогов. Продолжить игру будет нельзя.</p>
        <div className="confirm-actions">
          <button type="button" className="btn btn--ghost" onClick={() => setConfirmEnd(false)}>
            Продолжить игру
          </button>
          <button type="button" className="btn btn--primary" onClick={finishGame}>
            <Trophy size={16} /> Показать итоги
          </button>
        </div>
      </Modal>

      <Modal open={confirmRestart} onClose={() => setConfirmRestart(false)} size="sm" className="confirm-modal">
        <div className="confirm-icon confirm-icon--warn">
          <RotateCcw size={26} />
        </div>
        <h2>Начать заново?</h2>
        <p>Очки, открытые клетки и хроника обнулятся. Настройки игры сохранятся.</p>
        <div className="confirm-actions">
          <button type="button" className="btn btn--ghost" onClick={() => setConfirmRestart(false)}>
            Отмена
          </button>
          <button type="button" className="btn btn--primary" onClick={resetGame}>
            <RotateCcw size={16} /> Начать заново
          </button>
        </div>
      </Modal>

      {toast && (
        <div key={toast.id} className={`game-toast game-toast--${toast.tone}`}>
          <Sparkles size={16} /> {toast.text}
        </div>
      )}

      <div className="sr-only" aria-live="polite">
        {activeTeam ? `Ход команды ${activeTeam.name}` : ''}
      </div>
    </div>
  )
}
