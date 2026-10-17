import type { CSSProperties, ReactNode } from 'react'
import type { BoardCell, GameConfig, Team } from '../types'
import { THEMES, TEAM_COLORS, DOMAIN_META, SPECIAL_COLORS } from '../data/themes'
import { Icon } from './Icon'
import { assetUrl } from '../utils/asset'

export function gridPosition(index: number): { gridRow: number; gridColumn: number } {
  if (index === 0) return { gridRow: 1, gridColumn: 1 }
  if (index < 8) return { gridRow: 1, gridColumn: index + 1 }
  if (index === 8) return { gridRow: 1, gridColumn: 9 }
  if (index < 14) return { gridRow: index - 7, gridColumn: 9 }
  if (index === 14) return { gridRow: 7, gridColumn: 9 }
  if (index < 22) return { gridRow: 7, gridColumn: 9 - (index - 14) }
  if (index === 22) return { gridRow: 7, gridColumn: 1 }
  return { gridRow: 7 - (index - 22), gridColumn: 1 }
}

const tileKindLabel: Record<string, string> = {
  start: 'СТАРТ',
  bonus: 'БОНУС',
  rocket: 'РАКЕТА',
}

export function tileBackground(cell: BoardCell): string {
  if (cell.kind === 'start') return 'linear-gradient(145deg, #ffffff 0%, #e7eefb 48%, #c3d2e8 100%)'
  if (cell.kind === 'bonus') {
    return cell.index === 8 ? SPECIAL_COLORS.bonus : SPECIAL_COLORS.bonus2
  }
  if (cell.kind === 'rocket') return SPECIAL_COLORS.rocket
  if (cell.kind === 'lab') return SPECIAL_COLORS.lab
  if (cell.kind === 'practice') return SPECIAL_COLORS.practice
  if (cell.kind === 'problem') return SPECIAL_COLORS.problem
  if (cell.kind === 'formula') return SPECIAL_COLORS.formula
  if (cell.kind === 'question') return SPECIAL_COLORS.bonus
  const meta = DOMAIN_META[cell.domain] ?? DOMAIN_META.methods
  return `linear-gradient(148deg, #ffffff 0%, ${meta.soft} 38%, color-mix(in srgb, ${meta.color} 62%, #ffffff) 100%)`
}

interface BoardProps {
  config: GameConfig
  teams?: Team[]
  owners?: Record<number, string>
  activeTeamId?: string | null
  center: ReactNode
  className?: string
  compact?: boolean
  highlight?: number | null
}

export function Board({
  config,
  teams = [],
  owners = {},
  activeTeamId,
  center,
  className = '',
  compact = false,
  highlight = null,
}: BoardProps) {
  const theme = THEMES[config.themeId] ?? THEMES.g7
  const style = {
    '--accent': theme.accent,
    '--accent-2': theme.accent2,
    '--accent-soft': theme.accentSoft,
    '--board-bg': theme.boardBg,
    '--board-edge': theme.boardEdge,
    '--frame-a': theme.frameA,
    '--frame-b': theme.frameB,
    '--art-hue': `${theme.artHue}deg`,
    '--art-saturate': theme.artSaturate,
    '--page-glow': theme.pageGlow,
  } as CSSProperties

  return (
    <div className={`board-frame ${compact ? 'board-frame--compact' : ''} ${className}`} style={style}>
      <div className="board-frame-inner">
        <div className="board-grid">
          <div className="board-art" aria-hidden>
            <img src={assetUrl('img/physics-center.jpg')} alt="" />
            <div className="board-art-tint" />
            <div className="board-art-vignette" />
          </div>

          {config.board.map((cell) => {
            const pos = gridPosition(cell.index)
            const isCorner = cell.kind === 'start' || cell.kind === 'bonus' || cell.kind === 'rocket'
            const ownerId = owners[cell.index]
            const ownerTeam = teams.find((team) => team.id === ownerId)
            const ownerColor = ownerTeam
              ? TEAM_COLORS.find((color) => color.id === ownerTeam.color)?.from
              : undefined
            const tokens = teams.filter((team) => team.position === cell.index)
            const domainMeta = DOMAIN_META[cell.domain] ?? DOMAIN_META.methods

            return (
              <div
                key={cell.index}
                className={[
                  'tile',
                  `tile--${cell.kind}`,
                  isCorner ? 'tile--corner' : '',
                  ownerId ? 'is-owned' : '',
                  highlight === cell.index ? 'is-highlight' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{
                  gridRow: pos.gridRow,
                  gridColumn: pos.gridColumn,
                  background: tileBackground(cell),
                  ...(ownerColor ? { '--owner-color': ownerColor } : {}),
                }}
                title={cell.subtitle ? `${cell.title}: ${cell.subtitle}` : cell.title}
              >
                {ownerColor && <span className="tile-owner" />}
                {!isCorner && (
                  <div className="tile-top">
                    <span className="tile-kicker">{domainMeta.short}</span>
                    {cell.points > 0 && <span className="tile-points">+{cell.points}</span>}
                  </div>
                )}
                <span className={`tile-icon ${isCorner ? 'tile-icon--corner' : ''}`}>
                  <Icon name={cell.icon} size={isCorner ? 26 : 19} strokeWidth={2.1} />
                </span>
                <span
                  className={`tile-title ${isCorner ? 'tile-title--corner' : ''} ${
                    !isCorner && cell.title.length > 9 ? 'tile-title--long' : ''
                  }`}
                >
                  {isCorner ? tileKindLabel[cell.kind] ?? cell.title : cell.title}
                </span>
                {isCorner && cell.subtitle && <span className="tile-caption">{cell.subtitle}</span>}

                {tokens.length > 0 && (
                  <div className="tokens" aria-label="Команды на клетке">
                    {tokens.map((team) => {
                      const palette = TEAM_COLORS.find((color) => color.id === team.color) ?? TEAM_COLORS[0]
                      return (
                        <span
                          key={team.id}
                          className={`token-dot ${team.id === activeTeamId ? 'is-active' : ''}`}
                          style={{
                            background: `linear-gradient(150deg, ${palette.from}, ${palette.to})`,
                            boxShadow: `0 2px 6px rgba(0,0,0,.35), 0 0 0 1.5px rgba(255,255,255,.85)`,
                          }}
                          title={team.name}
                        >
                          {team.emoji}
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

          <div className="board-center">{center}</div>
        </div>
      </div>
      <div className="board-glow" aria-hidden />
    </div>
  )
}
