import { useId, useMemo, useRef, useState } from 'react';
import { useI18n } from '../../i18n/context';
import { buildTicks, niceCeiling, smoothPath, type ChartPoint } from './chartUtils';
import styles from './RevenueChart.module.css';

interface RevenueChartProps {
  labels: string[];
  current: number[];
  previous: number[];
  formatX: (label: string) => string;
  formatY: (value: number) => string;
  formatValue: (value: number) => string;
  ariaLabel: string;
  height?: number;
}

const WIDTH = 720;
const PADDING = { top: 16, right: 16, bottom: 30, left: 48 };

export function RevenueChart({
  labels,
  current,
  previous,
  formatX,
  formatY,
  formatValue,
  ariaLabel,
  height = 274,
}: RevenueChartProps) {
  const { locale } = useI18n();
  const gradientId = useId().replace(/:/g, '');
  const containerRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<number | null>(null);

  const maxValue = useMemo(
    () => niceCeiling(Math.max(...current, ...previous, 1)),
    [current, previous],
  );

  const plotWidth = WIDTH - PADDING.left - PADDING.right;
  const plotHeight = height - PADDING.top - PADDING.bottom;

  const xFor = (index: number) =>
    PADDING.left + (index / Math.max(labels.length - 1, 1)) * plotWidth;
  const yFor = (value: number) =>
    PADDING.top + (1 - value / maxValue) * plotHeight;

  const currentPoints: ChartPoint[] = current.map((value, index) => ({
    x: xFor(index),
    y: yFor(value),
  }));
  const previousPoints: ChartPoint[] = previous.map((value, index) => ({
    x: xFor(index),
    y: yFor(value),
  }));

  const currentLine = smoothPath(currentPoints);
  const previousLine = smoothPath(previousPoints);
  const area = `${currentLine} L ${xFor(labels.length - 1)} ${PADDING.top + plotHeight} L ${PADDING.left} ${PADDING.top + plotHeight} Z`;
  const ticks = buildTicks(maxValue, 4);
  const labelStep = Math.max(1, Math.ceil(labels.length / 7));

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }
    const relativeX = ((event.clientX - rect.left) / rect.width) * WIDTH;
    const index = Math.round(((relativeX - PADDING.left) / plotWidth) * (labels.length - 1));
    setHovered(Math.min(labels.length - 1, Math.max(0, index)));
  };

  const hoveredX = hovered !== null ? xFor(hovered) : 0;
  const hoveredCurrentY = hovered !== null ? yFor(current[hovered]) : 0;
  const hoveredPreviousY = hovered !== null ? yFor(previous[hovered]) : 0;

  return (
    <div
      ref={containerRef}
      className={styles.chart}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setHovered(null)}
    >
      <svg
        viewBox={`0 0 ${WIDTH} ${height}`}
        className={styles.svg}
        role="img"
        aria-label={ariaLabel}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-primary)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--chart-primary)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={PADDING.left}
              y1={yFor(tick)}
              x2={WIDTH - PADDING.right}
              y2={yFor(tick)}
              className={styles.gridLine}
            />
            <text
              x={PADDING.left - 10}
              y={yFor(tick) + 3}
              className={styles.axisLabel}
              textAnchor="end"
            >
              {formatY(tick)}
            </text>
          </g>
        ))}

        <path d={area} fill={`url(#${gradientId})`} />
        <path d={previousLine} className={styles.previousLine} fill="none" />
        <path d={currentLine} className={styles.currentLine} fill="none" />

        {labels.map((label, index) => {
          if (index % labelStep !== 0 && index !== labels.length - 1) {
            return null;
          }
          return (
            <text
              key={label}
              x={xFor(index)}
              y={height - 8}
              className={styles.axisLabel}
              textAnchor={index === 0 ? 'start' : index === labels.length - 1 ? 'end' : 'middle'}
            >
              {formatX(label)}
            </text>
          );
        })}

        {hovered !== null && (
          <g>
            <line
              x1={hoveredX}
              y1={PADDING.top}
              x2={hoveredX}
              y2={PADDING.top + plotHeight}
              className={styles.hoverLine}
            />
            <circle
              cx={hoveredX}
              cy={hoveredPreviousY}
              r={3.5}
              className={styles.previousDot}
            />
            <circle cx={hoveredX} cy={hoveredCurrentY} r={4.5} className={styles.currentDot} />
          </g>
        )}
      </svg>

      {hovered !== null && (
        <div
          className={styles.tooltip}
          style={{ left: `${(hoveredX / WIDTH) * 100}%` }}
          dir={locale === 'ar' ? 'rtl' : 'ltr'}
        >
          <p className={styles.tooltipLabel}>{formatX(labels[hovered])}</p>
          <p className={styles.tooltipValue}>
            <span className={styles.tooltipDot} />
            {formatValue(current[hovered])}
          </p>
          <p className={styles.tooltipPrevious}>{formatValue(previous[hovered])}</p>
        </div>
      )}
    </div>
  );
}
