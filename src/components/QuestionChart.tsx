import { useId } from 'react'
import type { ChartSpec } from '../types'
import { t } from '../i18n'

const W = 520
const H = 300
const M = { top: 34, right: 22, bottom: 48, left: 62 }
const seriesColor = (index: number) => `var(--chart-s${index % 4})`

const niceStep = (range: number, target = 5): number => {
  if (!Number.isFinite(range) || range <= 0) return 1
  const raw = range / target
  const power = Math.pow(10, Math.floor(Math.log10(raw)))
  const norm = raw / power
  const factor = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10
  return factor * power
}

const formatTick = (value: number, step: number): string => {
  if (Math.abs(value) < 1e-9) return '0'
  const decimals = step < 0.01 ? 3 : step < 0.1 ? 2 : step < 1 ? 1 : 0
  return value.toFixed(decimals).replace('.', ',')
}

const ticks = (min: number, max: number, step: number): number[] => {
  const result: number[] = []
  const start = Math.ceil(min / step - 1e-9) * step
  for (let value = start; value <= max + step * 1e-6 && result.length < 24; value += step) {
    result.push(Number(value.toFixed(6)))
  }
  return result
}

export function QuestionChart({ spec }: { spec: ChartSpec }) {
  const clipId = useId().replace(/:/g, '')
  const points = spec.series.flatMap((series) => series.points)
  if (points.length === 0) return null

  const xs = points.map(([x]) => x)
  const ys = points.map(([, y]) => y)
  let xMin = spec.xMin ?? Math.min(0, ...xs)
  let xMax = spec.xMax ?? Math.max(...xs)
  let yMin = spec.yMin ?? Math.min(0, ...ys)
  let yMax = spec.yMax ?? Math.max(...ys)
  if (xMax === xMin) xMax = xMin + 1
  if (yMax === yMin) yMax = yMin + 1

  const xStep = spec.xStep ?? niceStep(xMax - xMin)
  const yStep = spec.yStep ?? niceStep(yMax - yMin)
  const xTicks = ticks(xMin, xMax, xStep)
  const yTicks = ticks(yMin, yMax, yStep)

  const plotW = W - M.left - M.right
  const plotH = H - M.top - M.bottom
  const px = (x: number) => M.left + ((x - xMin) / (xMax - xMin)) * plotW
  const py = (y: number) => M.top + ((yMax - y) / (yMax - yMin)) * plotH

  const xZero = xMin <= 0 && xMax >= 0 ? px(0) : M.left
  const yZero = yMin <= 0 && yMax >= 0 ? py(0) : M.top + plotH
  const hasLegend = spec.series.some((series) => series.label)

  return (
    <figure className="question-chart">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${t("График:")} ${spec.yLabel} ${t("от")} ${spec.xLabel}`}
      >
        <defs>
          <clipPath id={`plot-${clipId}`}>
            <rect x={M.left} y={M.top} width={plotW} height={plotH} />
          </clipPath>
        </defs>

        {/* сетка */}
        {xTicks.map((value) => (
          <line
            key={`gx-${value}`}
            x1={px(value)}
            x2={px(value)}
            y1={M.top}
            y2={M.top + plotH}
            style={{ stroke: 'var(--chart-grid)' }}
            strokeWidth={1}
          />
        ))}
        {yTicks.map((value) => (
          <line
            key={`gy-${value}`}
            x1={M.left}
            x2={M.left + plotW}
            y1={py(value)}
            y2={py(value)}
            style={{ stroke: 'var(--chart-grid)' }}
            strokeWidth={1}
          />
        ))}

        {/* оси */}
        <line
          x1={xZero}
          x2={xZero}
          y1={M.top}
          y2={M.top + plotH}
          style={{ stroke: 'var(--chart-axis)' }}
          strokeWidth={1.4}
        />
        <line
          x1={M.left}
          x2={M.left + plotW}
          y1={yZero}
          y2={yZero}
          style={{ stroke: 'var(--chart-axis)' }}
          strokeWidth={1.4}
        />

        {/* подписи делений */}
        {xTicks.map((value) => (
          <text
            key={`tx-${value}`}
            x={px(value)}
            y={M.top + plotH + 17}
            textAnchor="middle"
            className="question-chart-tick"
          >
            {formatTick(value, xStep)}
          </text>
        ))}
        {yTicks.map((value) => (
          <text
            key={`ty-${value}`}
            x={M.left - 9}
            y={py(value) + 3.5}
            textAnchor="end"
            className="question-chart-tick"
          >
            {formatTick(value, yStep)}
          </text>
        ))}

        {/* подписи осей */}
        <text
          x={M.left + plotW / 2}
          y={H - 8}
          textAnchor="middle"
          className="question-chart-axis"
        >
          {spec.xLabel}
        </text>
        <text
          x={14}
          y={M.top + plotH / 2}
          textAnchor="middle"
          transform={`rotate(-90 14 ${M.top + plotH / 2})`}
          className="question-chart-axis"
        >
          {spec.yLabel}
        </text>

        {/* линии графиков */}
        <g clipPath={`url(#plot-${clipId})`}>
          {spec.series.map((series, index) => {
            const color = seriesColor(index)
            const sorted = [...series.points].sort((a, b) => a[0] - b[0])
            return (
              <g key={`series-${index}`}>
                <polyline
                  points={sorted.map(([x, y]) => `${px(x)},${py(y)}`).join(' ')}
                  fill="none"
                  style={{ stroke: color }}
                  strokeWidth={2.6}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeDasharray={series.dashed ? '7 5' : undefined}
                />
                {sorted.length <= 10 &&
                  sorted.map(([x, y], pointIndex) => (
                    <circle
                      key={`point-${pointIndex}`}
                      cx={px(x)}
                      cy={py(y)}
                      r={3.4}
                      style={{ fill: 'var(--chart-point)', stroke: color }}
                      strokeWidth={2}
                    />
                  ))}
              </g>
            )
          })}
        </g>

        {/* легенда */}
        {hasLegend && (
          <g>
            {spec.series.map((series, index) => {
              if (!series.label) return null
              const legendX = M.left + 8 + index * 150
              return (
                <g key={`legend-${index}`}>
                  <line
                    x1={legendX}
                    x2={legendX + 20}
                    y1={18}
                    y2={18}
                    style={{ stroke: seriesColor(index) }}
                    strokeWidth={2.6}
                    strokeDasharray={series.dashed ? '6 4' : undefined}
                  />
                  <text x={legendX + 26} y={22} className="question-chart-legend">
                    {series.label}
                  </text>
                </g>
              )
            })}
          </g>
        )}
      </svg>
      {spec.caption && <figcaption>{spec.caption}</figcaption>}
    </figure>
  )
}
