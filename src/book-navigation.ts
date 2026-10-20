export type StackSide = "left" | "right";

/** Zero-based page bounds represented by the paper behind an open spread. */
export function stackRange(
  side: StackSide,
  current: number,
  count: number,
): [number, number] | null {
  if (count < 2 || current <= 0 || current >= count - 1) return null;
  const start = side === "left" ? 0 : current + 2;
  const end = side === "left" ? current - 1 : count - 1;
  return start <= end ? [start, end] : null;
}

/** Both stacks follow reading order from left to right across their depth. */
export function stackTarget(
  side: StackSide,
  current: number,
  count: number,
  fraction: number,
): number | null {
  const range = stackRange(side, current, count);
  if (!range) return null;
  const ratio = Number.isFinite(fraction)
    ? Math.max(0, Math.min(1, fraction))
    : 0;
  return Math.round(range[0] + ratio * (range[1] - range[0]));
}

/** Cover on the right, then facing pairs; an unmatched back cover on the left. */
export function thumbnailSpreads(count: number): (number | null)[][] {
  if (count <= 0) return [];
  const spreads: (number | null)[][] = [[null, 0]];
  for (let i = 1; i < count; i += 2)
    spreads.push([i, i + 1 < count ? i + 1 : null]);
  return spreads;
}
