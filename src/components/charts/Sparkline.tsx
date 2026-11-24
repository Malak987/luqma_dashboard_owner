import { useId } from 'react';
import { cx } from '../../lib/cx';
import { linePath, smoothPath } from './chartUtils';
import styles from './Sparkline.module.css';

interface SparklineProps {
  values: number[];
  tone?: 'primary' | 'success' | 'accent' | 'danger' | 'info';
  width?: number;
  height?: number;
  className?: string;
}

export function Sparkline({
  values,
  tone = 'primary',
  width = 110,
  height = 38,
  className,
}: SparklineProps) {
  const gradientId = useId().replace(/:/g, '');
  const padding = 3;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((value, index) => ({
    x: padding + (index / Math.max(values.length - 1, 1)) * (width - padding * 2),
    y: padding + (1 - (value - min) / range) * (height - padding * 2),
  }));

  const line = smoothPath(points);
  const area = `${line} L ${points[points.length - 1]?.x ?? width} ${height} L ${points[0]?.x ?? 0} ${height} Z`;

  return (
    <svg
      className={cx(styles.sparkline, styles[tone], className)}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path
        d={linePath(points)}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
