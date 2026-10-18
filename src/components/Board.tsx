import type { CSSProperties, ReactNode } from 'react';
import type { BoardCell, GameConfig, Team } from '../types';
import { THEMES, TEAM_COLORS, DOMAIN_META, type BoardTheme } from '../data/themes';
import { Icon } from './Icon';
import { assetUrl } from '../utils/asset';
import { t } from '../i18n'
export function gridPosition(index: number): {
  gridRow: number;
  gridColumn: number;
} {
  if (index === 0) return {
    gridRow: 1,
    gridColumn: 1
  };
  if (index < 8) return {
    gridRow: 1,
    gridColumn: index + 1
  };
  if (index === 8) return {
    gridRow: 1,
    gridColumn: 9
  };
  if (index < 14) return {
    gridRow: index - 7,
    gridColumn: 9
  };
  if (index === 14) return {
    gridRow: 7,
    gridColumn: 9
  };
  if (index < 22) return {
    gridRow: 7,
    gridColumn: 9 - (index - 14)
  };
  if (index === 22) return {
    gridRow: 7,
    gridColumn: 1
  };
  return {
    gridRow: 7 - (index - 22),
    gridColumn: 1
  };
}
const tileKindLabel: Record<string, string> = {
  start: 'СТАРТ',
  bonus: 'БОНУС',
  rocket: 'РАКЕТА'
};

/**
 * Декоративный узор поля — свой для класса.
 * Рисуется на рамке и в центральной панели поверх арт-фона.
 */
export function ThemePattern({ theme, inner = false }: { theme: BoardTheme; inner?: boolean }) {
  const a = theme.frameA
  const b = theme.frameB
  const common = { fill: 'none', stroke: b, strokeOpacity: 0.5 }
  switch (theme.pattern) {
    case 'rays':
      return (
        <svg className={`board-pattern-svg ${inner ? 'board-pattern-svg--inner' : ''}`} viewBox="0 0 900 700" preserveAspectRatio="xMidYMid slice" aria-hidden>
          <defs>
            <radialGradient id={`pat-${theme.id}`} cx="50%" cy="50%" r="65%">
              <stop offset="0%" stopColor={a} stopOpacity="0.22" />
              <stop offset="55%" stopColor={b} stopOpacity="0.08" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="900" height="700" fill={`url(#pat-${theme.id})`} />
          {Array.from({ length: 24 }).map((_, i) => {
            const angle = (i * 15 * Math.PI) / 180
            const x2 = 450 + Math.cos(angle) * 620
            const y2 = 350 + Math.sin(angle) * 620
            return <line key={i} x1="450" y1="350" x2={x2} y2={y2} stroke={a} strokeOpacity="0.10" strokeWidth="2" />
          })}
        </svg>
      )
    case 'waves':
      return (
        <svg className={`board-pattern-svg ${inner ? 'board-pattern-svg--inner' : ''}`} viewBox="0 0 900 700" preserveAspectRatio="xMidYMid slice" aria-hidden>
          {Array.from({ length: 9 }).map((_, row) => (
            <path
              key={row}
              d={`M -20 ${60 + row * 80} C 120 ${20 + row * 80}, 260 ${100 + row * 80}, 400 ${60 + row * 80} S 680 ${20 + row * 80}, 820 ${60 + row * 80} S 940 ${100 + row * 80}, 940 ${60 + row * 80}`}
              {...common}
              strokeWidth="3"
              strokeOpacity="0.28"
            />
          ))}
          <circle cx="120" cy="120" r="46" stroke={a} strokeOpacity="0.3" fill="none" />
          <circle cx="790" cy="590" r="60" stroke={a} strokeOpacity="0.3" fill="none" />
        </svg>
      )
    case 'grid':
      return (
        <svg className={`board-pattern-svg ${inner ? 'board-pattern-svg--inner' : ''}`} viewBox="0 0 900 700" preserveAspectRatio="xMidYMid slice" aria-hidden>
          {Array.from({ length: 14 }).map((_, i) => (
            <line key={`v${i}`} x1={i * 70} y1="0" x2={i * 70} y2="700" {...common} strokeOpacity="0.16" strokeWidth="1.5" />
          ))}
          {Array.from({ length: 11 }).map((_, i) => (
            <line key={`h${i}`} x1="0" y1={i * 70} x2="900" y2={i * 70} {...common} strokeOpacity="0.16" strokeWidth="1.5" />
          ))}
          <circle cx="450" cy="350" r="150" stroke={a} strokeOpacity="0.22" fill="none" strokeWidth="2" strokeDasharray="10 8" />
          <circle cx="450" cy="350" r="230" stroke={a} strokeOpacity="0.12" fill="none" strokeWidth="2" strokeDasharray="4 10" />
        </svg>
      )
    case 'molecules': {      const atoms = [[110, 120, 34], [760, 100, 26], [820, 560, 40], [90, 590, 24], [450, 350, 30], [260, 620, 18], [640, 620, 20]]
      const bonds: [number, number][] = [[0, 4], [1, 4], [2, 4], [3, 4], [0, 5], [4, 6], [1, 6]]
      return (
        <svg className={`board-pattern-svg ${inner ? 'board-pattern-svg--inner' : ''}`} viewBox="0 0 900 700" preserveAspectRatio="xMidYMid slice" aria-hidden>
          {bonds.map(([from, to], i) => (
            <line key={i} x1={atoms[from][0]} y1={atoms[from][1]} x2={atoms[to][0]} y2={atoms[to][1]} {...common} strokeOpacity="0.3" strokeWidth="3" />
          ))}
          {atoms.map(([cx, cy, r], i) => (
            <g key={i}>
              <circle cx={cx} cy={cy} r={r} fill={a} fillOpacity="0.16" stroke={b} strokeOpacity="0.4" strokeWidth="2" />
              <circle cx={cx - r * 0.3} cy={cy - r * 0.3} r={r * 0.28} fill={a} fillOpacity="0.5" />
            </g>
          ))}
        </svg>
      )
    }
    case 'orbits':
      return (
        <svg className={`board-pattern-svg ${inner ? 'board-pattern-svg--inner' : ''}`} viewBox="0 0 900 700" preserveAspectRatio="xMidYMid slice" aria-hidden>
          {[150, 240, 330].map((r, i) => (
            <ellipse key={i} cx="450" cy="350" rx={r * 1.35} ry={r * 0.72} {...common} strokeOpacity={0.32 - i * 0.07} strokeWidth="2" transform={`rotate(${[-18, 14, 42][i]} 450 350)`} />
          ))}
          <circle cx="450" cy="350" r="34" fill={a} fillOpacity="0.35" />
          {[0, 1, 2].map((i) => {
            const angle = [0.4, 2.5, 4.4][i]
            const r = [202, 302, 400][i]
            return <circle key={`m${i}`} cx={450 + Math.cos(angle) * r * 1.35} cy={350 + Math.sin(angle) * r * 0.72} r="10" fill={a} fillOpacity="0.55" />
          })}
        </svg>
      )
    case 'stars':
    default:
      return (
        <svg className={`board-pattern-svg ${inner ? 'board-pattern-svg--inner' : ''}`} viewBox="0 0 900 700" preserveAspectRatio="xMidYMid slice" aria-hidden>
          {Array.from({ length: 26 }).map((_, i) => {
            const x = (i * 173) % 900
            const y = (i * 97) % 700
            const r = 1.2 + (i % 4) * 0.9
            return <circle key={i} cx={x} cy={y} r={r} fill={i % 5 === 0 ? a : b} fillOpacity={i % 5 === 0 ? 0.5 : 0.3} />
          })}
          {[120, 780, 450].map((cx, i) => {
            const cy = [110, 600, 350][i]
            return (
              <path key={i} d={`M ${cx} ${cy - 16} L ${cx + 4} ${cy - 4} L ${cx + 16} ${cy} L ${cx + 4} ${cy + 4} L ${cx} ${cy + 16} L ${cx - 4} ${cy + 4} L ${cx - 16} ${cy} L ${cx - 4} ${cy - 4} Z`} fill={a} fillOpacity="0.5" />
            )
          })}
        </svg>
      )
  }
}
export function tileBackground(cell: BoardCell, theme: BoardTheme): string {
  if (cell.kind === 'start') return 'linear-gradient(145deg, #ffffff 0%, #eef3fa 48%, #d9e4f3 100%)';
  /* Бонус и ракета — в гамме темы, а не радуга */
  if (cell.kind === 'bonus') {
    const base = cell.index === 8 ? theme.accent : theme.accent2;
    return `linear-gradient(145deg, #ffffff 0%, color-mix(in srgb, ${base} 22%, #ffffff) 45%, color-mix(in srgb, ${base} 42%, #ffffff) 100%)`;
  }
  if (cell.kind === 'rocket') {
    return `linear-gradient(145deg, color-mix(in srgb, ${theme.accent} 30%, #ffffff) 0%, color-mix(in srgb, ${theme.accent2} 48%, #ffffff) 55%, color-mix(in srgb, ${theme.accent2} 62%, #ffffff) 100%)`;
  }
  /* Содержательные клетки: белая карточка с мягким оттенком раздела */
  const meta = DOMAIN_META[cell.domain] ?? DOMAIN_META.methods;
  return `linear-gradient(148deg, #ffffff 0%, ${meta.soft} 55%, color-mix(in srgb, ${meta.color} 30%, #ffffff) 100%)`;
}
interface BoardProps {
  config: GameConfig;
  teams?: Team[];
  owners?: Record<number, string>;
  activeTeamId?: string | null;
  center: ReactNode;
  className?: string;
  compact?: boolean;
  highlight?: number | null;
}
export function Board({
  config,
  teams = [],
  owners = {},
  activeTeamId,
  center,
  className = '',
  compact = false,
  highlight = null
}: BoardProps) {
  const theme = THEMES[config.themeId] ?? THEMES.g7;
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
    '--page-glow': theme.pageGlow
  } as CSSProperties;
  return <div className={`board-frame ${compact ? 'board-frame--compact' : ''} ${className}`} style={style}>
      <ThemePattern theme={theme} />
      <div className="board-frame-inner">
        <div className="board-grid">
          <div className="board-art" aria-hidden>
            <img src={assetUrl('img/physics-center.jpg')} alt="" />
            <div className="board-art-tint" />
            <div className="board-art-vignette" />
          </div>

          {config.board.map(cell => {
          const pos = gridPosition(cell.index);
          const isCorner = cell.kind === 'start' || cell.kind === 'bonus' || cell.kind === 'rocket';
          const ownerId = owners[cell.index];
          const ownerTeam = teams.find(team => team.id === ownerId);
          const ownerColor = ownerTeam ? TEAM_COLORS.find(color => color.id === ownerTeam.color)?.from : undefined;
          const tokens = teams.filter(team => team.position === cell.index);
          const domainMeta = DOMAIN_META[cell.domain] ?? DOMAIN_META.methods;
          return <div key={cell.index} className={['tile', `tile--${cell.kind}`, isCorner ? 'tile--corner' : '', ownerId ? 'is-owned' : '', highlight === cell.index ? 'is-highlight' : ''].filter(Boolean).join(' ')} style={{
                  gridRow: pos.gridRow,
                  gridColumn: pos.gridColumn,
                  background: tileBackground(cell, theme),
            ...(ownerColor ? {
              '--owner-color': ownerColor
            } : {})
          }} title={cell.subtitle ? `${t(cell.title)}: ${t(cell.subtitle)}` : t(cell.title)}>
                {ownerColor && <span className="tile-owner" />}
                {!isCorner && <div className="tile-top">
                    <span className="tile-kicker">{t(domainMeta.short)}</span>
                    {cell.points > 0 && <span className="tile-points">+{cell.points}</span>}
                  </div>}
                <span className={`tile-icon ${isCorner ? 'tile-icon--corner' : ''}`}>
                  <Icon name={cell.icon} size={isCorner ? 26 : 19} strokeWidth={2.1} />
                </span>
                <span className={`tile-title ${isCorner ? 'tile-title--corner' : ''} ${!isCorner && cell.title.length > 9 ? 'tile-title--long' : ''}`}>
                  {isCorner ? t(tileKindLabel[cell.kind] ?? cell.title) : t(cell.title)}
                </span>
                {isCorner && cell.subtitle && <span className="tile-caption">{t(cell.subtitle)}</span>}

                {tokens.length > 0 && <div className="tokens" aria-label={t("Команды на клетке")}>
                    {tokens.map(team => {
                const palette = TEAM_COLORS.find(color => color.id === team.color) ?? TEAM_COLORS[0];
                return <span key={team.id} className={`token-dot ${team.id === activeTeamId ? 'is-active' : ''}`} style={{
                  background: `linear-gradient(150deg, ${palette.from}, ${palette.to})`,
                  boxShadow: `0 2px 6px rgba(0,0,0,.35), 0 0 0 1.5px rgba(255,255,255,.85)`
                }} title={team.name}>
                          {team.emoji}
                        </span>;
              })}
                  </div>}
              </div>;
        })}

          <div className="board-center">
            <ThemePattern theme={theme} inner />
            {center}
          </div>
        </div>
      </div>
      <div className="board-glow" aria-hidden />
    </div>;
}