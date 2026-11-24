export interface ChartPoint {
  x: number;
  y: number;
}

export function linePath(points: ChartPoint[]): string {
  if (points.length === 0) {
    return '';
  }
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
}

export function smoothPath(points: ChartPoint[]): string {
  if (points.length === 0) {
    return '';
  }
  if (points.length === 1) {
    return `M ${points[0].x} ${points[0].y}`;
  }

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[index - 1] ?? points[index];
    const current = points[index];
    const next = points[index + 1];
    const afterNext = points[index + 2] ?? next;

    const controlOneX = current.x + (next.x - previous.x) / 6;
    const controlOneY = current.y + (next.y - previous.y) / 6;
    const controlTwoX = next.x - (afterNext.x - current.x) / 6;
    const controlTwoY = next.y - (afterNext.y - current.y) / 6;

    path += ` C ${controlOneX} ${controlOneY}, ${controlTwoX} ${controlTwoY}, ${next.x} ${next.y}`;
  }

  return path;
}

export function niceCeiling(value: number): number {
  if (value <= 0) {
    return 1;
  }

  const rough = value * 1.12;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const normalized = rough / magnitude;
  const nice = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return nice * magnitude;
}

export function buildTicks(max: number, count = 4): number[] {
  return Array.from({ length: count + 1 }, (_, index) => (max / count) * index);
}
