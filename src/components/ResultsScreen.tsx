import type { CSSProperties } from 'react'
import { Download, Flag, Home, Medal, RotateCcw, Settings2, Sparkles, Trophy, Users } from 'lucide-react'
import type { GameConfig, Team } from '../types'
import { THEMES, TEAM_COLORS } from '../data/themes'
import { formatNumber, pluralize } from '../game/engine'
import { downloadFile } from '../data/storage'

interface ResultsScreenProps {
  config: GameConfig
  teams: Team[]
  turns: number
  captured: number
  totalCells: number
  onRestart: () => void
  onSettings: () => void
  onExit: () => void
}

export function ResultsScreen({
  config,
  teams,
  turns,
  captured,
  totalCells,
  onRestart,
  onSettings,
  onExit,
}: ResultsScreenProps) {
  const theme = THEMES[config.themeId] ?? THEMES.g7
  const sorted = [...teams].sort((a, b) => b.score - a.score)
  const best = sorted[0]?.score ?? 0
  const winners = sorted.filter((team) => team.score === best)
  const isTie = winners.length > 1
  const placeOf = (team: Team): number => sorted.filter((item) => item.score > team.score).length + 1
  const samePlaceCount = (place: number): number => sorted.filter((team) => placeOf(team) === place).length

  const exportResults = () => {
    const rows = [
      'Место;Команда;Очки;Верных ответов;Ошибок;Перехватов',
      ...sorted.map((team, index) => {
        const place = sorted.filter((t) => t.score > team.score).length + 1
        return [
          place,
          team.name,
          team.score,
          team.correct,
          team.wrong,
          team.captures,
        ].join(';')
      }),
      '',
      `Игра;${config.title}`,
      `Формат;${config.subtitle}`,
      `Ходов;${turns}`,
      `Открыто клеток;${captured} из ${totalCells}`,
    ]
    downloadFile(`физика-поли-${config.title.replace(/\s+/g, '-').toLowerCase()}.csv`, rows.join('\n'))
  }

  return (
    <div className="results-page" style={{ '--accent': theme.accent, '--accent-2': theme.accent2 } as CSSProperties}>
      <div className="confetti" aria-hidden>
        {Array.from({ length: 28 }).map((_, index) => (
          <span
            key={index}
            style={
              {
                '--i': index,
                '--hue': (index * 47) % 360,
                '--x': `${(index * 37) % 100}%`,
                '--delay': `${(index % 9) * 0.35}s`,
                '--duration': `${4 + (index % 5)}s`,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div className="results-inner">
        <div className="results-eyebrow">
          <Sparkles size={15} /> Игра завершена · {config.subtitle}
        </div>
        <h1 className="results-title">
          {isTie ? 'Ничья — отличная работа!' : `Победа команды «${winners[0]?.name}»`}
        </h1>
        <p className="results-sub">
          {pluralize(best, `${formatNumber(best)} очко`, `${formatNumber(best)} очка`, `${formatNumber(best)} очков`)} ·{' '}
          {turns} {pluralize(turns, 'ход', 'хода', 'ходов')} · открыто {captured} из {totalCells} клеток
        </p>

        <div className="podium">
          {sorted.map((team, index) => {
            const palette = TEAM_COLORS.find((color) => color.id === team.color) ?? TEAM_COLORS[0]
            const place = placeOf(team)
            const tieCount = samePlaceCount(place)
            return (
              <article
                key={team.id}
                className={`podium-card place-${place} ${place === 1 ? 'is-winner' : ''}`}
                style={{ '--team-from': palette.from, '--team-to': palette.to } as CSSProperties}
              >
                <div className="podium-place">
                  {place === 1 ? <Trophy size={20} /> : place === 2 ? <Medal size={18} /> : <Flag size={16} />}
                  {place} {pluralize(place, 'место', 'места', 'мест')}
                  {tieCount > 1 ? ' · ничья' : ''}
                </div>
                <div className="podium-token">
                  <span>{team.emoji}</span>
                </div>
                <h3>{team.name}</h3>
                <div className="podium-score">{formatNumber(team.score)}</div>
                <div className="podium-unit">очков</div>
                <div className="podium-stats">
                  <span>
                    <b>{team.correct}</b> верно
                  </span>
                  <span>
                    <b>{team.wrong}</b> ошибок
                  </span>
                  <span>
                    <b>{team.captures}</b> перехватов
                  </span>
                </div>
              </article>
            )
          })}
        </div>

        <div className="results-summary panel">
          <div className="results-summary-head">
            <div>
              <div className="eyebrow">Итоги по командам</div>
              <h2>Таблица результатов</h2>
            </div>
            <div className="results-chips">
              <span>
                <Users size={15} /> {teams.length} {pluralize(teams.length, 'команда', 'команды', 'команд')}
              </span>
              <span>
                <Trophy size={15} /> {config.rounds} {pluralize(config.rounds, 'круг', 'круга', 'кругов')}
              </span>
            </div>
          </div>
          <div className="results-table">
            <div className="results-row results-row--head">
              <span>Место</span>
              <span>Команда</span>
              <span>Очки</span>
              <span>Верно</span>
              <span>Ошибки</span>
              <span>Перехваты</span>
            </div>
            {sorted.map((team) => {
              const palette = TEAM_COLORS.find((color) => color.id === team.color) ?? TEAM_COLORS[0]
              const place = placeOf(team)
              const tieCount = samePlaceCount(place)
              return (
                <div key={team.id} className="results-row">
                  <span className={`place-badge place-badge--${place}`}>
                    {place}
                    {tieCount > 1 ? <small>=</small> : null}
                  </span>
                  <span className="results-team">
                    <i style={{ background: `linear-gradient(145deg, ${palette.from}, ${palette.to})` }}>{team.emoji}</i>
                    {team.name}
                  </span>
                  <span className="results-score">{formatNumber(team.score)}</span>
                  <span>{team.correct}</span>
                  <span>{team.wrong}</span>
                  <span>{team.captures}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="results-actions">
          <button type="button" className="btn btn--primary btn--lg" onClick={onRestart}>
            <RotateCcw size={18} /> Играть снова
          </button>
          <button type="button" className="btn btn--ghost btn--lg" onClick={onSettings}>
            <Settings2 size={18} /> Изменить настройки
          </button>
          <button type="button" className="btn btn--ghost btn--lg" onClick={exportResults}>
            <Download size={18} /> Скачать результаты
          </button>
          <button type="button" className="btn btn--ghost btn--lg" onClick={onExit}>
            <Home size={18} /> В меню
          </button>
        </div>
      </div>
    </div>
  )
}
