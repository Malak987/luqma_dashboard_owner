import { useMemo } from 'react';
import { buildTicks, niceCeiling } from './chartUtils';
import styles from './OrdersBarChart.module.css';

interface OrdersBarChartProps {
  labels: string[];
  values: number[];
  formatX: (label: string) => string;
  formatY: (value: number) => string;
  ariaLabel: string;
}

const WIDTH = 620;
const PADDING = { top: 14, right: 8, bottom: 30, left: 40 };

export function OrdersBarChart({ labels, values, formatX, formatY, ariaLabel }: OrdersBarChartProps) {
  const height = 226;
  const maxValue = useMemo(() => niceCeiling(Math.max(...values, 1)), [values]);
  const plotWidth = WIDTH - PADDING.left - PADDING.right;
  const plotHeight = height - PADDING.top - PADDING.bottom;
  const slot = plotWidth / Math.max(values.length, 1);
  const barWidth = Math.min(34, slot * 0.48);
  const ticks = buildTicks(maxValue, 3);
  const maxIndex = values.indexOf(Math.max(...values));

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${height}`}
      className={styles.chart}
      role="img"
      aria-label={ariaLabel}
    >
      {ticks.map((tick) => {
        const y = PADDING.top + (1 - tick / maxValue) * plotHeight;
        return (
          <g key={tick}>
            <line
              x1={PADDING.left}
              y1={y}
              x2={WIDTH - PADDING.right}
              y2={y}
              className={styles.gridLine}
            />
            <text x={PADDING.left - 9} y={y + 3} className={styles.axisLabel} textAnchor="end">
              {formatY(tick)}
            </text>
          </g>
        );
      })}

      {values.map((value, index) => {
        const barHeight = Math.max(4, (value / maxValue) * plotHeight);
        const x = PADDING.left + slot * index + (slot - barWidth) / 2;
        const y = PADDING.top + plotHeight - barHeight;
        return (
          <g key={labels[index]}>
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={Math.min(7, barWidth / 2)}
              className={index === maxIndex ? styles.barActive : styles.bar}
            />
            <text
              x={x + barWidth / 2}
              y={height - 8}
              className={styles.axisLabel}
              textAnchor="middle"
            >
              {formatX(labels[index])}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
